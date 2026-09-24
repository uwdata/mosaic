package query

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"path/filepath"
	"strings"
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
	var width int64
	err := tx.QueryRowContext(ctx, `SELECT coalesce(sum(CASE
		WHEN data_type IN ('BOOLEAN', 'TINYINT', 'UTINYINT') THEN 1
		WHEN data_type IN ('SMALLINT', 'USMALLINT') THEN 2
		WHEN data_type IN ('INTEGER', 'UINTEGER', 'FLOAT', 'DATE') THEN 4
		WHEN data_type IN ('HUGEINT', 'UHUGEINT', 'UUID') OR data_type LIKE 'DECIMAL(%' AND numeric_precision > 18 THEN 16
		WHEN data_type LIKE 'DECIMAL(%' OR data_type IN ('BIGINT', 'UBIGINT', 'DOUBLE', 'TIMESTAMP', 'TIMESTAMP WITH TIME ZONE', 'TIME', 'INTERVAL') THEN 8
		ELSE 16 END), 0)::BIGINT
		FROM system.main.duckdb_columns() WHERE database_name = ? AND schema_name = ? AND table_name = ?`,
		ref.Catalog, ref.schema(), ref.Table).Scan(&width)
	stats.Bytes = stats.Rows * width
	return stats, err
}

// ParquetMaterializer writes the result to <Directory>/<catalog>/<schema>/<table>.parquet and publishes a view over
// it. A replica that finds the file already present publishes the view without recomputing. Nothing deletes files;
// use the location's lifecycle rules, and give each replica its own local directory since an interrupted local write
// leaves a partial file that later publishes would reuse. Stats come from the Parquet footer; bytes are compressed size.
type ParquetMaterializer struct {
	// Directory is a local path or a DuckDB filesystem URL such as s3://bucket/prefix once the matching extension is
	// loaded during trusted initialization.
	Directory string
}

func (m ParquetMaterializer) Materialize(ctx context.Context, tx *sql.Tx, ref Reference, source string) (Stats, error) {
	var stats Stats
	if m.Directory == "" {
		return stats, errors.New("query: parquet materializer requires a directory")
	}
	path := strings.Join(append(append([]string{strings.TrimRight(m.Directory, "/"), ref.Catalog}, ref.Schema...), ref.Table+".parquet"), "/")
	if strings.ContainsAny(path, "'\x00") {
		return stats, errors.New("query: invalid parquet path")
	}
	file := quoteLiteral(path)
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
