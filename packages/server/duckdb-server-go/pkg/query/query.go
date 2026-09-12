package query

import (
	"bytes"
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"fmt"
	"io"
	"log/slog"

	"github.com/apache/arrow-go/v18/arrow/ipc"
	"github.com/duckdb/duckdb-go/v2"
)

var ErrExecWithValidation = errors.New("query: exec command is disabled when query validation is active")

type DB struct {
	db                *sql.DB
	functionBlocklist []string
	functionAllowlist *FunctionAllowlistOptions
	catalog           string
	logger            *slog.Logger
}

func New(ctx context.Context, connector *duckdb.Connector, opts ...OptionFunc) (*DB, error) {
	o := &Options{MaxConnections: 10, Logger: slog.Default()}
	for _, opt := range opts {
		if err := opt(o); err != nil {
			return nil, fmt.Errorf("query: failed to apply option: %w", err)
		}
	}
	if o.RejectRemoteURILiterals {
		return nil, errors.New("query: remote URI literal rejection is unsupported by Gatekeeper; use function authorization and external resource controls")
	}
	o.FunctionBlocklist = normalizeFunctionNames(o.FunctionBlocklist)
	if o.FunctionAllowlist != nil && len(o.FunctionBlocklist) > 0 {
		return nil, errors.New("query: function allowlist and blocklist cannot both be configured")
	}
	var allowlist *FunctionAllowlistOptions
	if o.FunctionAllowlist != nil {
		allowlist = &FunctionAllowlistOptions{Include: normalizeFunctionNames(o.FunctionAllowlist.Include), Exclude: normalizeFunctionNames(o.FunctionAllowlist.Exclude), DisableDefaults: o.FunctionAllowlist.DisableDefaults}
	}
	db := sql.OpenDB(connector)
	db.SetMaxOpenConns(o.MaxConnections)
	extension := o.GatekeeperExtension
	if extension == "" {
		extension = "gatekeeper"
	}
	if _, err := db.ExecContext(ctx, "LOAD "+quoteLiteral(extension)); err != nil {
		return nil, errors.Join(fmt.Errorf("query: failed to load Gatekeeper: %w", err), db.Close())
	}
	var catalog string
	if err := db.QueryRowContext(ctx, "SELECT system.main.current_database()").Scan(&catalog); err != nil {
		return nil, errors.Join(fmt.Errorf("query: failed to identify primary catalog: %w", err), db.Close())
	}
	return &DB{db: db, catalog: catalog, functionBlocklist: o.FunctionBlocklist, functionAllowlist: allowlist, logger: o.Logger}, nil
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
			return nil, err
		}
		extensions = append(extensions, ext)
	}
	return extensions, rows.Err()
}

func (db *DB) Close() {
	if err := db.db.Close(); err != nil {
		db.logger.Error("failed to close database", "error", err)
	}
}

func (db *DB) Exec(ctx context.Context, query string) error {
	if len(db.functionBlocklist) > 0 || db.functionAllowlist != nil {
		return ErrExecWithValidation
	}
	if _, err := db.db.ExecContext(ctx, query); err != nil {
		return fmt.Errorf("query: failed to execute query: %w", err)
	}
	return nil
}

func (db *DB) validatedConn(ctx context.Context, query string, allowedSchemas []string) (*sql.Conn, error) {
	conn, err := db.db.Conn(ctx)
	if err != nil {
		return nil, err
	}
	if allowedSchemas != nil || len(db.functionBlocklist) > 0 || db.functionAllowlist != nil {
		policy := ValidationPolicy{AllowedSchemas: allowedSchemas, BlockedFunctions: db.functionBlocklist, FunctionAllowlist: db.functionAllowlist}
		if err := db.validateSQL(ctx, conn, query, policy); err != nil {
			return nil, errors.Join(fmt.Errorf("query: validation failed: %w", err), conn.Close())
		}
	}
	return conn, nil
}

func (db *DB) validateQuery(ctx context.Context, query string, allowedSchemas []string) error {
	conn, err := db.validatedConn(ctx, query, allowedSchemas)
	if err != nil {
		return err
	}
	return conn.Close()
}

func (db *DB) QueryArrow(ctx context.Context, query string, allowedSchemas []string) ([]byte, error) {
	var buf bytes.Buffer
	if err := db.WriteArrow(ctx, query, allowedSchemas, &buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (db *DB) WriteArrow(ctx context.Context, query string, allowedSchemas []string, w io.Writer) error {
	conn, err := db.validatedConn(ctx, query, allowedSchemas)
	if err != nil {
		return err
	}
	defer func() {
		if err := conn.Close(); err != nil {
			db.logger.Error("query: failed to release connection", "error", err)
		}
	}()
	return conn.Raw(func(raw any) error {
		arrow, err := duckdb.NewArrowFromConn(raw.(driver.Conn))
		if err != nil {
			return err
		}
		rdr, err := arrow.QueryContext(ctx, query)
		if err != nil {
			return fmt.Errorf("query: failed to execute query: %w", err)
		}
		defer rdr.Release()
		writer := ipc.NewWriter(w, ipc.WithSchema(rdr.Schema()))
		for rdr.Next() {
			if err := writer.Write(rdr.RecordBatch()); err != nil {
				return errors.Join(err, writer.Close())
			}
		}
		return errors.Join(rdr.Err(), writer.Close())
	})
}
