package query

import (
	"bytes"
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"fmt"
	"log/slog"

	"github.com/apache/arrow-go/v18/arrow/ipc"
	"github.com/duckdb/duckdb-go/v2"
)

var ErrExecWithValidation = errors.New("query: exec command is disabled when query validation is active")

type DB struct {
	db         *sql.DB
	validation bool
	logger     *slog.Logger
}

// New opens a pooled database on connector. It does not install or load Gatekeeper; trusted initialization (the
// connector's init callback or --load-extensions) owns that. With WithValidation, New fails when Gatekeeper is absent.
func New(ctx context.Context, connector *duckdb.Connector, opts ...OptionFunc) (*DB, error) {
	o := &Options{MaxConnections: 10, Logger: slog.Default()}
	for _, opt := range opts {
		if err := opt(o); err != nil {
			return nil, fmt.Errorf("query: failed to apply option: %w", err)
		}
	}
	db := sql.OpenDB(connector)
	db.SetMaxOpenConns(o.MaxConnections)
	result := &DB{db: db, validation: o.Validation, logger: o.Logger}
	if o.Validation {
		if _, err := result.ValidateSQL(ctx, "SELECT 1", ValidationPolicy{}); err != nil {
			return nil, errors.Join(fmt.Errorf("query: Gatekeeper with the JSON policy API (0.3.0+) is required for validation; load it during trusted initialization or upgrade with FORCE INSTALL gatekeeper FROM community: %w", err), db.Close())
		}
	}
	return result, nil
}

type Extension struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	Repository  string `json:"repository"`
	InstallMode string `json:"install_mode"`
}

func (db *DB) GetExtensions(ctx context.Context) ([]Extension, error) {
	rows, err := db.db.QueryContext(ctx, `SELECT extension_name, extension_version, installed_from, install_mode FROM duckdb_extensions() WHERE install_mode != 'NOT_INSTALLED'`)
	if err != nil {
		return nil, fmt.Errorf("query: failed to get extensions: %w", err)
	}
	defer rows.Close()
	var extensions []Extension
	for rows.Next() {
		var ext Extension
		if err := rows.Scan(&ext.Name, &ext.Version, &ext.Repository, &ext.InstallMode); err != nil {
			return nil, fmt.Errorf("query: failed to scan extension row: %w", err)
		}
		extensions = append(extensions, ext)
	}
	return extensions, rows.Err()
}

// Close closes the pool created by New. database/sql also closes connectors that implement io.Closer, and
// duckdb.Connector does, so this closes the DuckDB database behind connector; a later connector.Close is a no-op.
func (db *DB) Close() {
	if err := db.db.Close(); err != nil {
		db.logger.Error("failed to close database", "error", err)
	}
}

// Exec runs SQL without validation. It is refused when WithValidation is configured.
func (db *DB) Exec(ctx context.Context, query string) error {
	if db.validation {
		return ErrExecWithValidation
	}
	if _, err := db.db.ExecContext(ctx, query); err != nil {
		return fmt.Errorf("query: failed to execute query: %w", err)
	}
	return nil
}

// Query validates query against policy when policy is non-nil or WithValidation is configured, then executes it
// on the same connection and returns the Arrow IPC stream.
func (db *DB) Query(ctx context.Context, query string, policy *ValidationPolicy) ([]byte, error) {
	conn, err := db.db.Conn(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := conn.Close(); err != nil {
			db.logger.Error("query: failed to release connection", "error", err)
		}
	}()
	if policy == nil && db.validation {
		policy = &ValidationPolicy{}
	}
	if policy != nil {
		if _, err := db.validateSQL(ctx, conn, query, *policy); err != nil {
			return nil, err
		}
	}
	var buf bytes.Buffer
	err = conn.Raw(func(raw any) error {
		arrow, err := duckdb.NewArrowFromConn(raw.(driver.Conn))
		if err != nil {
			return err
		}
		rdr, err := arrow.QueryContext(ctx, query)
		if err != nil {
			return fmt.Errorf("query: failed to execute query: %w", err)
		}
		defer rdr.Release()
		writer := ipc.NewWriter(&buf, ipc.WithSchema(rdr.Schema()))
		for rdr.Next() {
			if err := writer.Write(rdr.RecordBatch()); err != nil {
				return errors.Join(err, writer.Close())
			}
		}
		return errors.Join(rdr.Err(), writer.Close())
	})
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
