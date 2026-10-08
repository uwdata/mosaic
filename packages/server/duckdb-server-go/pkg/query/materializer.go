package query

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// TableMaterializer runs CREATE TABLE AS. Rows come from table statistics; bytes are rows times the declared column
// widths, with 16 bytes for strings, blobs, and nested types.
type TableMaterializer struct{}

func (TableMaterializer) Materialize(ctx context.Context, tx *sql.Tx, ref Reference, source string) (Stats, error) {
	var stats Stats
	if _, err := tx.ExecContext(ctx, "CREATE TABLE "+ref.String()+" AS "+source); err != nil {
		return stats, err
	}
	if err := tx.QueryRowContext(ctx, "SELECT count(*) FROM "+ref.String()).Scan(&stats.Rows); err != nil {
		return stats, err
	}
	rows, err := tx.QueryContext(ctx, `SELECT database_name, schema_name, table_name, data_type, coalesce(numeric_precision, 0)
		FROM system.main.duckdb_columns() WHERE lower(database_name) = lower(?) AND lower(schema_name) = lower(?) AND lower(table_name) = lower(?)`,
		ref.Catalog, ref.schema(), ref.Table)
	if err != nil {
		return stats, err
	}
	defer rows.Close()
	var width int64
	for rows.Next() {
		var catalog, schema, table, dataType string
		var precision int64
		if err := rows.Scan(&catalog, &schema, &table, &dataType, &precision); err != nil {
			return stats, err
		}
		if ref.equal(Reference{catalog, []string{schema}, table}) {
			width += columnWidth(dataType, precision)
		}
	}
	err = rows.Err()
	stats.Bytes = stats.Rows * width
	return stats, err
}

// ParquetMaterializer writes the result to <Directory>/<catalog>/<schema>/<table>.parquet and publishes a view over
// it, with each path segment percent-encoded so distinct namespaces never share a file. A replica that finds the file
// already present publishes the view without recomputing. Nothing deletes files; use the location's lifecycle rules,
// and give each replica its own local directory since an interrupted local write leaves a partial file that later
// publishes would reuse. Stats come from the Parquet footer; bytes are compressed size.
//
// Writes to one path are serialized within the process, so concurrent builds of the same reference produce one COPY.
// Across replicas sharing a directory the object store's atomic replacement is the only guard, and DuckDB's temporary
// file rename is not safe against a concurrent writer of the same key.
type ParquetMaterializer struct {
	// Directory is a local path or a DuckDB filesystem URL such as s3://bucket/prefix once the matching extension is
	// loaded during trusted initialization.
	Directory string

	mu     sync.Mutex
	writes map[string]*sync.Mutex
}

// pathSegment folds ASCII case like DuckDB identifiers and encodes every other byte outside [a-z0-9_-] as %XX, which
// is injective per object, glob-safe, and keeps "/" and "." from being interpreted as directory structure.
func pathSegment(component string) string {
	var b strings.Builder
	for i := 0; i < len(component); i++ {
		c := component[i]
		if c >= 'A' && c <= 'Z' {
			c += 'a' - 'A'
		}
		if c >= 'a' && c <= 'z' || c >= '0' && c <= '9' || c == '_' || c == '-' {
			b.WriteByte(c)
		} else {
			fmt.Fprintf(&b, "%%%02X", c)
		}
	}
	return b.String()
}

func (m *ParquetMaterializer) lock(path string) func() {
	m.mu.Lock()
	if m.writes == nil {
		m.writes = make(map[string]*sync.Mutex)
	}
	l := m.writes[path]
	if l == nil {
		l = &sync.Mutex{}
		m.writes[path] = l
	}
	m.mu.Unlock()
	l.Lock()
	return l.Unlock
}

func (m *ParquetMaterializer) Materialize(ctx context.Context, tx *sql.Tx, ref Reference, source string) (Stats, error) {
	var stats Stats
	if m.Directory == "" {
		return stats, errors.New("query: parquet materializer requires a directory")
	}
	if strings.ContainsAny(m.Directory, "'\x00") {
		return stats, errors.New("query: invalid parquet directory")
	}
	segments := []string{strings.TrimRight(m.Directory, "/"), pathSegment(ref.Catalog)}
	for _, schema := range ref.Schema {
		segments = append(segments, pathSegment(schema))
	}
	path := strings.Join(append(segments, pathSegment(ref.Table)+".parquet"), "/")
	file := quoteLiteral(path)
	defer m.lock(path)()
	var exists bool
	if err := tx.QueryRowContext(ctx, "SELECT count(*) > 0 FROM glob("+file+")").Scan(&exists); err != nil {
		return stats, err
	}
	if !exists {
		if scheme, _, found := strings.Cut(path, "://"); !found || strings.ContainsAny(scheme, `/\`) {
			if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
				return stats, err
			}
		}
		if _, err := tx.ExecContext(ctx, "COPY ("+source+") TO "+file+" (FORMAT PARQUET)"); err != nil {
			return stats, err
		}
	}
	if _, err := tx.ExecContext(ctx, "CREATE VIEW "+ref.String()+" AS SELECT * FROM read_parquet("+file+")"); err != nil {
		return stats, err
	}
	err := tx.QueryRowContext(ctx, `SELECT coalesce(sum(num_rows), 0)::BIGINT, coalesce((SELECT sum(total_compressed_size) FROM parquet_metadata(`+file+`)), 0)::BIGINT
		FROM parquet_file_metadata(`+file+`)`).Scan(&stats.Rows, &stats.Bytes)
	return stats, err
}

func columnWidth(dataType string, precision int64) int64 {
	switch dataType {
	case "BOOLEAN", "TINYINT", "UTINYINT":
		return 1
	case "SMALLINT", "USMALLINT":
		return 2
	case "INTEGER", "UINTEGER", "FLOAT", "DATE":
		return 4
	case "BIGINT", "UBIGINT", "DOUBLE", "TIMESTAMP", "TIMESTAMP WITH TIME ZONE", "TIME", "INTERVAL":
		return 8
	case "HUGEINT", "UHUGEINT", "UUID":
		return 16
	}
	if strings.HasPrefix(dataType, "DECIMAL(") {
		if precision > 18 {
			return 16
		}
		return 8
	}
	return 16
}
