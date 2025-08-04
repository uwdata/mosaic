package query

import (
	"bytes"
	"context"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"hash/maphash"
	"io"
	"log/slog"

	"github.com/apache/arrow-go/v18/arrow/ipc"
	"github.com/marcboeker/go-duckdb/v2"
	"github.com/maypok86/otter/v2"
	"golang.org/x/sync/semaphore"
)

type DB struct {
	db    *sql.DB
	conn  driver.Conn
	arrow *duckdb.Arrow
	// Semaphore to limit concurrent Arrow queries, since db.SetMaxOpenConns doesn't apply to Arrow connections
	arrowSemaphore *semaphore.Weighted

	cache     *otter.Cache[uint64, []byte]
	cacheSeed maphash.Seed

	logger *slog.Logger
}

// New creates a new DB instance using the provided DuckDB connector, opening a sql.DB and arrow connection.
// The logger is optional; if nil, it defaults to slog.Default().
func New(ctx context.Context, connector *duckdb.Connector, connectionPoolSize, cacheSize int, logger *slog.Logger) (*DB, error) {
	db := sql.OpenDB(connector)
	db.SetMaxOpenConns(connectionPoolSize)

	conn, err := connector.Connect(ctx)
	if err != nil {
		return nil, err
	}

	arrow, err := duckdb.NewArrowFromConn(conn)
	if err != nil {
		return nil, err
	}

	arrowSemaphore := semaphore.NewWeighted(int64(connectionPoolSize))

	if logger == nil {
		logger = slog.Default()
	}

	cache, err := otter.New[uint64, []byte](&otter.Options[uint64, []byte]{
		MaximumSize: cacheSize,
	})
	if err != nil {
		return nil, fmt.Errorf("query: failed to create cache: %w", err)
	}

	return &DB{
		db:             db,
		conn:           conn,
		arrow:          arrow,
		arrowSemaphore: arrowSemaphore,

		cache:     cache,
		cacheSeed: maphash.MakeSeed(), // Initialize the cache seed for consistent hashing

		logger: logger,
	}, nil
}

// Close closes any resources created by New, but does not close the underlying connector.
func (db *DB) Close() {
	err := db.db.Close()
	if err != nil {
		db.logger.Error("failed to close database", "error", err)
	}

	err = db.conn.Close()
	if err != nil {
		db.logger.Error("failed to close database connection", "error", err)
	}
}

func (db *DB) Exec(ctx context.Context, query string) error {
	_, err := db.db.ExecContext(ctx, query)
	if err != nil {
		return fmt.Errorf("query: failed to execute query: %w", err)
	}

	return nil
}

func (db *DB) QueryJSON(ctx context.Context, query string, allowedSchemas []string, useCache bool) (json.RawMessage, bool, error) {
	var key uint64
	var data []byte

	if useCache && db.cache != nil {
		key, data = db.cacheGet("j", query)
		if data != nil {
			return data, true, nil
		}
	}

	var buf bytes.Buffer

	err := db.WriteJSON(ctx, query, allowedSchemas, &buf)
	if err != nil {
		return nil, false, err
	}

	if useCache && db.cache != nil {
		db.cacheSet(key, buf.Bytes())
	}

	return buf.Bytes(), false, nil
}

func (db *DB) WriteJSON(ctx context.Context, query string, allowedSchemas []string, w io.Writer) error {
	if len(allowedSchemas) > 0 {
		err := db.ValidateSQL(ctx, query, allowedSchemas)
		if err != nil {
			return fmt.Errorf("query: validation failed for query: %w", err)
		}
	}

	err := db.arrowSemaphore.Acquire(ctx, 1)
	if err != nil {
		return fmt.Errorf("query: failed to acquire connection: %w", err)
	}
	defer db.arrowSemaphore.Release(1)

	rdr, err := db.arrow.QueryContext(ctx, query)
	if err != nil {
		return fmt.Errorf("query: failed to execute query: %w", err)
	}
	defer rdr.Release()

	_, err = w.Write([]byte("["))
	if err != nil {
		return fmt.Errorf("query: failed to write start of JSON array: %w", err)
	}

	for i := 0; rdr.Next(); i++ {
		if i > 0 {
			_, err = w.Write([]byte(","))
			if err != nil {
				return fmt.Errorf("query: failed to write comma between records: %w", err)
			}
		}

		var jsonBytes []byte
		jsonBytes, err = rdr.Record().MarshalJSON()
		if err != nil {
			return fmt.Errorf("failed to marshal record to JSON: %w", err)
		}

		// a record is a batch of rows, and MarshalJSON returns a JSON array of objects. If there are multiple records,
		// we want a combined JSON array of objects, not an array of arrays, so we trim the outer brackets
		_, err = w.Write(jsonBytes[1 : len(jsonBytes)-1])
		if err != nil {
			return fmt.Errorf("failed to write JSON to writer: %w", err)
		}
	}

	_, err = w.Write([]byte("]"))
	if err != nil {
		return fmt.Errorf("query: failed to write end of JSON array: %w", err)
	}

	return nil
}

func (db *DB) QueryArrow(ctx context.Context, query string, allowedSchemas []string, useCache bool) ([]byte, bool, error) {
	var key uint64
	var data []byte

	if useCache && db.cache != nil {
		key, data = db.cacheGet("j", query)
		if data != nil {
			return data, true, nil
		}
	}

	var buf bytes.Buffer

	err := db.WriteArrow(ctx, query, allowedSchemas, &buf)
	if err != nil {
		return nil, false, err
	}

	if useCache && db.cache != nil {
		db.cacheSet(key, buf.Bytes())
	}

	return buf.Bytes(), false, nil
}

func (db *DB) WriteArrow(ctx context.Context, query string, allowedSchemas []string, w io.Writer) error {
	if len(allowedSchemas) > 0 {
		err := db.ValidateSQL(ctx, query, allowedSchemas)
		if err != nil {
			return fmt.Errorf("query: validation failed for query: %w", err)
		}
	}

	err := db.arrowSemaphore.Acquire(ctx, 1)
	if err != nil {
		return fmt.Errorf("query: failed to acquire connection: %w", err)
	}
	defer db.arrowSemaphore.Release(1)

	rdr, err := db.arrow.QueryContext(ctx, query)
	if err != nil {
		return fmt.Errorf("query: failed to execute query: %w", err)
	}
	defer rdr.Release()

	arrowWriter := ipc.NewWriter(w, ipc.WithSchema(rdr.Schema()))
	defer func() {
		err = arrowWriter.Close()
		if err != nil {
			db.logger.Error("query: failed to close Arrow writer", "error", err)
		}
	}()

	for rdr.Next() {
		err = arrowWriter.Write(rdr.Record())
		if err != nil {
			return fmt.Errorf("query: failed to write record: %w", err)
		}
	}
	if rdr.Err() != nil {
		return fmt.Errorf("query: error during record iteration: %w", rdr.Err())
	}

	return nil
}

// cacheGet always returns a key, and either the cached data or nil if not found
func (db *DB) cacheGet(format, query string) (uint64, []byte) {
	// the key has to be different based on the output data type, so we can cache arrow and json separately
	key := maphash.String(db.cacheSeed, query+format)

	entry, ok := db.cache.GetEntry(key)
	if ok {
		return key, entry.Value
	}

	return key, nil
}

func (db *DB) cacheSet(key uint64, data []byte) {
	db.cache.Set(key, data)
}
