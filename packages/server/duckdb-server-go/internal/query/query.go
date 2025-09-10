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
	"runtime"
	"sync"

	"github.com/apache/arrow-go/v18/arrow/ipc"
	"github.com/marcboeker/go-duckdb/v2"
	"github.com/maypok86/otter/v2"
	"golang.org/x/sync/semaphore"
)

type DB struct {
	db *sql.DB

	// since db.SetMaxOpenConns doesn't apply to Arrow connections, we're using a sync.Pool to reuse connections,
	// and a semaphore to limit connections to the same as the sql.DB max connections
	connPool       *sync.Pool
	arrowSemaphore *semaphore.Weighted

	cache     *otter.Cache[uint64, []byte]
	cacheSeed maphash.Seed

	logger *slog.Logger
}

// New creates a new DB instance using the provided DuckDB connector, opening a sql.DB and arrow connection.
// The logger is optional; if nil, it defaults to slog.Default().
func New(ctx context.Context, connector *duckdb.Connector, opts ...OptionFunc) (*DB, error) {
	o := &Options{
		MaxConnections:  10,
		MaxCacheEntries: 1000,
		Logger:          slog.Default(),
	}
	for _, opt := range opts {
		err := opt(o)
		if err != nil {
			return nil, fmt.Errorf("query: failed to apply option: %w", err)
		}
	}

	db := sql.OpenDB(connector)
	db.SetMaxOpenConns(o.MaxConnections)

	arrowSemaphore := semaphore.NewWeighted(int64(o.MaxConnections))

	// the cache can be limited either by number of entries or total size in bytes
	// if both are set, MaxCacheBytes takes precedence
	cacheOpts := &otter.Options[uint64, []byte]{}

	switch {
	case o.MaxCacheBytes > 0:
		cacheOpts.MaximumWeight = uint64(o.MaxCacheBytes)
		cacheOpts.Weigher = func(key uint64, value []byte) uint32 {
			return uint32(len(value))
		}

	case o.MaxCacheEntries > 0:
		cacheOpts.MaximumSize = o.MaxCacheEntries
	}

	if o.TTL > 0 {
		cacheOpts.ExpiryCalculator = otter.ExpiryCreating[uint64, []byte](o.TTL)
	}

	cache, err := otter.New[uint64, []byte](cacheOpts)
	if err != nil {
		return nil, fmt.Errorf("query: failed to create cache: %w", err)
	}

	return &DB{
		db: db,

		connPool:       newArrowSyncPool(ctx, connector, o.Logger),
		arrowSemaphore: arrowSemaphore,

		cache:     cache,
		cacheSeed: maphash.MakeSeed(), // Initialize the cache seed for consistent hashing

		logger: o.Logger,
	}, nil
}

func newArrowSyncPool(ctx context.Context, connector *duckdb.Connector, logger *slog.Logger) *sync.Pool {
	return &sync.Pool{
		New: func() any {
			conn, err := connector.Connect(ctx)
			if err != nil {
				return nil
			}

			arrow, err := duckdb.NewArrowFromConn(conn)
			if err != nil {
				return nil
			}

			runtime.AddCleanup(arrow, func(driverConn driver.Conn) {
				closeErr := driverConn.Close()
				if closeErr != nil {
					logger.Error("query: failed to close Arrow connection", "error", closeErr)
				}
			}, conn)

			return arrow
		},
	}
}

func (db *DB) getArrowConn(ctx context.Context) (*duckdb.Arrow, error) {
	err := db.arrowSemaphore.Acquire(ctx, 1)
	if err != nil {
		return nil, fmt.Errorf("query: failed to acquire connection: %w", err)
	}

	untypedArrow := db.connPool.Get()
	if untypedArrow == nil {
		return nil, fmt.Errorf("query: failed to get Arrow connection from pool")
	}

	arrow, ok := untypedArrow.(*duckdb.Arrow)
	if !ok {
		return nil, fmt.Errorf("query: invalid type in Arrow connection pool")
	}

	return arrow, nil
}

func (db *DB) putArrowConn(arrow *duckdb.Arrow) {
	db.connPool.Put(arrow)
	db.arrowSemaphore.Release(1)
}

type Extension struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	Repository  string `json:"repository"`
	InstallMode string `json:"install_mode"`
}

func (db *DB) GetExtensions(ctx context.Context) ([]Extension, error) {
	const stmt = `SELECT extension_name, extension_version, installed_from, install_mode
FROM duckdb_extensions()
WHERE install_mode != 'NOT_INSTALLED'`

	rows, err := db.db.QueryContext(ctx, stmt)
	if err != nil {
		return nil, fmt.Errorf("query: failed to get extensions: %w", err)
	}
	defer rows.Close()

	var extensions []Extension
	for rows.Next() {
		var ext Extension
		err = rows.Scan(&ext.Name, &ext.Version, &ext.Repository, &ext.InstallMode)
		if err != nil {
			return nil, fmt.Errorf("query: failed to scan extension row: %w", err)
		}

		extensions = append(extensions, ext)
	}
	err = rows.Err()
	if err != nil {
		return nil, fmt.Errorf("query: error during rows iteration: %w", err)
	}

	return extensions, nil
}

// Close closes any resources created by New, but does not close the underlying connector.
func (db *DB) Close() {
	err := db.db.Close()
	if err != nil {
		db.logger.Error("failed to close database", "error", err)
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
		btValidator := newBaseTableValidator(allowedSchemas)
		err := db.ValidateSQL(ctx, query, btValidator)
		if err != nil {
			return fmt.Errorf("query: validation failed for query: %w", err)
		}
	}

	arrow, err := db.getArrowConn(ctx)
	if err != nil {
		return err
	}
	defer db.putArrowConn(arrow)

	rdr, err := arrow.QueryContext(ctx, query)
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
		btValidator := newBaseTableValidator(allowedSchemas)
		err := db.ValidateSQL(ctx, query, btValidator)
		if err != nil {
			return fmt.Errorf("query: validation failed for query: %w", err)
		}
	}

	arrow, err := db.getArrowConn(ctx)
	if err != nil {
		return err
	}
	defer db.putArrowConn(arrow)

	rdr, err := arrow.QueryContext(ctx, query)
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
