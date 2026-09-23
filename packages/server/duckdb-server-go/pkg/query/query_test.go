package query

import (
	"bytes"
	"context"
	"database/sql/driver"
	"encoding/json"
	"log/slog"
	"os"
	"strings"
	"testing"

	"github.com/apache/arrow-go/v18/arrow/ipc"
	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extensions"
)

const testDSN = ":memory:?autoload_known_extensions=false&autoinstall_known_extensions=false"

// setupTestDB installs and loads Gatekeeper in the connector init, mirroring the CLI's trusted initialization.
func setupTestDB(t *testing.T, opts ...OptionFunc) *DB {
	t.Helper()
	return setupTestDBWithInit(t, func(ctx context.Context, execer driver.ExecerContext) error {
		return extensions.InstallAndLoad(ctx, execer, "gatekeeper", "community")
	}, opts...)
}

func setupTestDBWithInit(t *testing.T, init func(context.Context, driver.ExecerContext) error, opts ...OptionFunc) *DB {
	t.Helper()

	connector := newTestConnector(t, testDSN, init)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	opts = append([]OptionFunc{WithLogger(logger)}, opts...)
	db, err := New(context.Background(), connector, opts...)
	require.NoError(t, err)
	t.Cleanup(db.Close)

	return db
}

func newTestConnector(t *testing.T, dsn string, init func(context.Context, driver.ExecerContext) error) *duckdb.Connector {
	t.Helper()

	ctx := context.Background()
	connector, err := duckdb.NewConnector(dsn, func(execer driver.ExecerContext) error {
		return init(ctx, execer)
	})
	require.NoError(t, err)
	t.Cleanup(func() {
		if err := connector.Close(); err != nil {
			t.Logf("Error closing DuckDB connector: %v", err)
		}
	})

	return connector
}

func quoteLiteral(s string) string { return "'" + strings.ReplaceAll(s, "'", "''") + "'" }

func arrowRows(t *testing.T, data []byte) []map[string]any {
	t.Helper()

	rdr, err := ipc.NewReader(bytes.NewReader(data))
	require.NoError(t, err)
	defer rdr.Release()

	rows := []map[string]any{}
	for rdr.Next() {
		batchJSON, err := rdr.RecordBatch().MarshalJSON()
		require.NoError(t, err)

		var batch []map[string]any
		require.NoError(t, json.Unmarshal(batchJSON, &batch))
		rows = append(rows, batch...)
	}
	require.NoError(t, rdr.Err())

	return rows
}

func TestDB_FunctionBlocklist(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()
	policy := &ValidationPolicy{BlockedFunctions: []string{"RANGE", "MD5", "SUM", "ROW_NUMBER"}}

	tests := []struct {
		name     string
		function string
		query    string
	}{
		{name: "table function", function: "range", query: "SELECT * FROM range(3)"},
		{name: "scalar function", function: "md5", query: "SELECT md5('mosaic')"},
		{name: "window aggregate", function: "sum", query: "SELECT sum(i) OVER () FROM (VALUES (1), (2), (3)) t(i)"},
		{name: "window function", function: "row_number", query: "SELECT row_number() OVER ()"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := db.QueryArrow(ctx, tt.query, policy)

			require.Equal(t, tt.function, requireViolation(t, err, "function").FunctionName)
		})
	}
}

func TestDB_FunctionAllowlist(t *testing.T) {
	ctx := context.Background()
	db := setupTestDB(t)
	exact := func(functions ...string) *ValidationPolicy {
		return &ValidationPolicy{AllowedFunctions: functions, UseDefaultFunctions: boolPtr(false)}
	}
	defaults := &ValidationPolicy{}

	t.Run("allows exact case-insensitive function names", func(t *testing.T) {
		policy := exact("MD5", "ROW_NUMBER", "RANGE", "+", "COUNT_STAR", "LIST_VALUE")

		tests := []struct {
			name  string
			query string
		}{
			{name: "scalar function", query: "SELECT md5('mosaic')"},
			{name: "window function", query: "SELECT row_number() OVER ()"},
			{name: "operator", query: "SELECT 1 + 2"},
			{name: "table function", query: "SELECT * FROM range(3)"},
			{name: "normalized function name", query: "SELECT count(*)"},
			{name: "main-qualified function", query: "SELECT main.md5('mosaic')"},
			{name: "main-qualified normalized function", query: "SELECT main.count(*) FROM (SELECT 1)"},
			{name: "helper over qualified column", query: "SELECT [main.x] FROM (SELECT 1 AS x) AS main"},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				_, err := db.QueryArrow(ctx, tt.query, policy)
				require.NoError(t, err)
			})
		}
	})

	t.Run("rejects a function that is not listed", func(t *testing.T) {
		_, err := db.QueryArrow(ctx, "SELECT md5('mosaic')", exact("md"))
		require.ErrorIs(t, err, ErrAccessDenied)
		require.Equal(t, "md5", requireViolation(t, err, "function").FunctionName)
	})

	t.Run("rejects nested functions that are not listed", func(t *testing.T) {
		_, err := db.QueryArrow(ctx, "SELECT md5(lower('mosaic'))", exact("md5"))
		require.ErrorIs(t, err, ErrAccessDenied)
		require.Equal(t, "lower", requireViolation(t, err, "function").FunctionName)
	})

	t.Run("matches qualified functions by leaf name", func(t *testing.T) {
		require.NoError(t, db.Exec(ctx, "CREATE SCHEMA tenant; CREATE MACRO tenant.md5(x) AS system.main.md5(x)"))

		for _, query := range []string{
			"SELECT tenant.md5('mosaic')",
			"SELECT system.main.count(*) FROM (SELECT 1)",
		} {
			require.NoError(t, db.ValidateSQL(ctx, query, *exact("md5", "count_star")))
		}
	})

	t.Run("rejects parser helpers that are not listed", func(t *testing.T) {
		_, err := db.QueryArrow(ctx, "SELECT * FROM read_parquet(['local.parquet'])", exact("read_parquet"))
		require.ErrorIs(t, err, ErrAccessDenied)
		require.Equal(t, "list_value", requireViolation(t, err, "function").FunctionName)
	})

	t.Run("defaults allow common expressions", func(t *testing.T) {
		for _, query := range []string{
			"SELECT 1 + 2",
			"SELECT sum(i), count(*) FROM (VALUES (1), (2)) t(i)",
			"SELECT geomean(i) FROM (VALUES (1), (2)) t(i)",
			"SELECT weighted_avg(i, w) FROM (VALUES (1, 2), (2, 1)) t(i, w)",
			"SELECT row_number() OVER ()",
			"SELECT lower('MOSAIC')",
			"SELECT [1, 2]",
			"SELECT list_sum([1, 2]), list_histogram([1, 2]), array_append([1], 2)",
			"SELECT date_add(DATE '2020-01-01', INTERVAL 1 DAY), days_in_month(DATE '2020-02-01')",
			"SELECT split_part('a,b', ',', 2), fdiv(5, 2), fmod(5, 2), round_even(2.5, 0)",
			"SELECT json_group_array(i), json_group_object(i, i) FROM (VALUES (1), (2)) t(i)",
			"SELECT strptime('2020-01-01', '%Y-%m-%d')",
			"SELECT * FROM range(3)",
			"SELECT random(), now(), current_date, ago(INTERVAL 1 DAY)",
		} {
			_, err := db.QueryArrow(ctx, query, defaults)
			require.NoError(t, err, query)
		}
	})

	t.Run("defaults classify extension functions before binding", func(t *testing.T) {
		for _, query := range []string{
			"SELECT st_x(st_point(1, 2))",
			"SELECT json_serialize_sql('SELECT 1')",
			"SELECT iceberg_bucket(16, 'value')",
		} {
			err := db.ValidateSQL(ctx, query, *defaults)
			if query == "SELECT json_serialize_sql('SELECT 1')" {
				require.NoError(t, err)
			} else {
				var details ErrorDetails
				require.ErrorAs(t, err, &details)
				require.Equal(t, "binding", details.Code)
			}
		}

		for function, query := range map[string]string{
			"json_execute_serialized_sql": "SELECT * FROM json_execute_serialized_sql('{}')",
			"st_read":                     "SELECT * FROM st_read('data.geojson')",
			"st_transform":                "SELECT st_transform(NULL, 'EPSG:4326', 'EPSG:3857')",
		} {
			err := db.ValidateSQL(ctx, query, *defaults)
			require.ErrorIs(t, err, ErrAccessDenied)
			require.Equal(t, function, requireViolation(t, err, "function").FunctionName)
		}
	})

	t.Run("defaults reject unsafe name collisions", func(t *testing.T) {
		_, err := db.QueryArrow(ctx, "SELECT * FROM histogram('duckdb_tables', 'table_name')", defaults)
		require.ErrorIs(t, err, ErrAccessDenied)
		require.Equal(t, "histogram", requireViolation(t, err, "function").FunctionName)
	})

	t.Run("defaults reject privileged functions", func(t *testing.T) {
		tests := []struct {
			function string
			query    string
		}{
			{function: "query", query: "SELECT * FROM query('SELECT 1')"},
			{function: "list_aggr", query: "SELECT list_aggr([1, 2], 'sum')"},
			{function: "list_aggregate", query: "SELECT list_aggregate([1, 2], 'sum')"},
			{function: "read_parquet", query: "SELECT * FROM read_parquet('missing.parquet')"},
			{function: "getenv", query: "SELECT getenv('HOME')"},
			{function: "pg_sleep", query: "SELECT pg_sleep(0)"},
			{function: "sleep_ms", query: "SELECT sleep_ms(1)"},
			{function: "getenv", query: "SELECT list_transform(['HOME'], x -> getenv(x))"},
		}

		for _, tt := range tests {
			t.Run(tt.function, func(t *testing.T) {
				_, err := db.QueryArrow(ctx, tt.query, defaults)
				require.ErrorIs(t, err, ErrAccessDenied)
				require.Equal(t, tt.function, requireViolation(t, err, "function").FunctionName)
			})
		}
	})

	t.Run("defaults can be disabled", func(t *testing.T) {
		_, err := db.QueryArrow(ctx, "SELECT 1", &ValidationPolicy{UseDefaultFunctions: boolPtr(false)})
		require.NoError(t, err)

		_, err = db.QueryArrow(ctx, "SELECT 1 + 2", &ValidationPolicy{UseDefaultFunctions: boolPtr(false)})
		require.ErrorIs(t, err, ErrAccessDenied)
		require.Equal(t, "+", requireViolation(t, err, "function").FunctionName)
	})

	t.Run("defaults can be blocked", func(t *testing.T) {
		policy := &ValidationPolicy{BlockedFunctions: []string{"SUM"}}
		_, err := db.QueryArrow(ctx, "SELECT 1 + 2", policy)
		require.NoError(t, err)

		_, err = db.QueryArrow(ctx, "SELECT sum(i) FROM (VALUES (1), (2)) t(i)", policy)
		require.ErrorIs(t, err, ErrAccessDenied)
		require.Equal(t, "sum", requireViolation(t, err, "function").FunctionName)
	})

	t.Run("blocks win over allows", func(t *testing.T) {
		policy := &ValidationPolicy{AllowedFunctions: []string{"MD5", "sum"}, BlockedFunctions: []string{"SUM", "+"}}
		_, err := db.QueryArrow(ctx, "SELECT md5('x')", policy)
		require.NoError(t, err)
		for _, q := range []string{"SELECT sum(1)", "SELECT 1+2"} {
			_, err := db.QueryArrow(ctx, q, policy)
			requireViolation(t, err, "function")
		}
	})
}

func TestDB_ValidationHandlesUnsupportedStatements(t *testing.T) {
	db := setupTestDB(t, WithValidation())

	_, err := db.QueryArrow(t.Context(), "PRAGMA version", nil)
	require.ErrorIs(t, err, ErrUnsupportedStatement)
	require.ErrorContains(t, err, "only supported read statements are permitted")
	require.NotContains(t, err.Error(), "()")
	require.NotContains(t, err.Error(), " at :")
}

func TestDB_Exec(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	t.Run("create table", func(t *testing.T) {
		err := db.Exec(ctx, "CREATE TABLE test_table (id INTEGER, name VARCHAR)")
		assert.NoError(t, err)
	})

	t.Run("insert data", func(t *testing.T) {
		err := db.Exec(ctx, "CREATE TABLE users (id INTEGER, name VARCHAR)")
		require.NoError(t, err)

		err = db.Exec(ctx, "INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')")
		assert.NoError(t, err)
	})

	t.Run("invalid SQL", func(t *testing.T) {
		err := db.Exec(ctx, "INVALID SQL STATEMENT")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "query: failed to execute query")
	})

	t.Run("validation rejects exec", func(t *testing.T) {
		db := setupTestDB(t, WithValidation())

		err := db.Exec(ctx, "SELECT 1")
		require.ErrorIs(t, err, ErrExecWithValidation)
		assert.EqualError(t, err, "query: exec command is disabled when query validation is active")
	})
}

func TestDB_QueryArrowRows(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	err := db.Exec(ctx, "CREATE TABLE products (id INTEGER, name VARCHAR, price DECIMAL)")
	require.NoError(t, err)
	err = db.Exec(ctx, "INSERT INTO products VALUES (1, 'Apple', 1.50), (2, 'Banana', 0.75), (3, 'Orange', 2.00), (NULL, NULL, NULL)")
	require.NoError(t, err)

	const query = "SELECT * FROM products ORDER BY id"

	// these aren't the types I would choose, but that's how Arrow marshals them
	want := []map[string]any{
		{"id": float64(1), "name": "Apple", "price": "1.5"},
		{"id": float64(2), "name": "Banana", "price": "0.75"},
		{"id": float64(3), "name": "Orange", "price": "2"},
		{"id": nil, "name": nil, "price": nil},
	}

	t.Run("simple select", func(t *testing.T) {
		got, err := db.QueryArrow(ctx, query, nil)
		require.NoError(t, err)
		assert.Equal(t, want, arrowRows(t, got))
	})

	t.Run("invalid query", func(t *testing.T) {
		_, err := db.QueryArrow(ctx, "SELECT * FROM nonexistent_table", nil)
		assert.Error(t, err)
	})

	t.Run("empty result set", func(t *testing.T) {
		result, err := db.QueryArrow(ctx, "SELECT * FROM products WHERE id > 100", nil)
		require.NoError(t, err)
		assert.Empty(t, arrowRows(t, result))
	})
}

func TestDB_QueryArrow(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	// Setup test data
	err := db.Exec(ctx, "CREATE TABLE measurements (sensor_id INTEGER, temperature DOUBLE, timestamp TIMESTAMP)")
	require.NoError(t, err)
	err = db.Exec(ctx, "INSERT INTO measurements VALUES (1, 23.5, '2023-01-01 10:00:00'), (2, 24.1, '2023-01-01 10:01:00')")
	require.NoError(t, err)

	const query = "SELECT * FROM measurements ORDER BY sensor_id"

	want := []byte{255, 255, 255, 255, 240, 0, 0, 0, 16, 0, 0, 0, 0, 0, 10, 0, 12, 0, 10, 0, 9, 0, 4, 0, 10, 0, 0, 0, 16, 0, 0, 0, 0, 1, 4, 0, 8, 0, 8, 0, 0, 0, 4, 0, 8, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 132, 0, 0, 0, 56, 0, 0, 0, 4, 0, 0, 0, 152, 255, 255, 255, 16, 0, 0, 0, 16, 0, 0, 0, 0, 0, 10, 1, 16, 0, 0, 0, 0, 0, 0, 0, 206, 255, 255, 255, 0, 0, 2, 0, 9, 0, 0, 0, 116, 105, 109, 101, 115, 116, 97, 109, 112, 0, 0, 0, 200, 255, 255, 255, 16, 0, 0, 0, 24, 0, 0, 0, 0, 0, 3, 1, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 8, 0, 6, 0, 6, 0, 0, 0, 0, 0, 2, 0, 11, 0, 0, 0, 116, 101, 109, 112, 101, 114, 97, 116, 117, 114, 101, 0, 16, 0, 20, 0, 16, 0, 15, 0, 14, 0, 8, 0, 0, 0, 4, 0, 16, 0, 0, 0, 16, 0, 0, 0, 24, 0, 0, 0, 0, 0, 2, 1, 28, 0, 0, 0, 0, 0, 0, 0, 8, 0, 12, 0, 8, 0, 7, 0, 8, 0, 0, 0, 0, 0, 0, 1, 32, 0, 0, 0, 9, 0, 0, 0, 115, 101, 110, 115, 111, 114, 95, 105, 100, 0, 0, 0, 255, 255, 255, 255, 232, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 12, 0, 22, 0, 20, 0, 19, 0, 12, 0, 4, 0, 12, 0, 0, 0, 40, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 3, 4, 0, 10, 0, 24, 0, 12, 0, 8, 0, 4, 0, 10, 0, 0, 0, 20, 0, 0, 0, 120, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 128, 55, 64, 154, 153, 153, 153, 153, 25, 56, 64, 0, 168, 209, 229, 48, 241, 5, 0, 0, 47, 101, 233, 48, 241, 5, 0, 255, 255, 255, 255, 0, 0, 0, 0}

	t.Run("query arrow", func(t *testing.T) {
		got, err := db.QueryArrow(ctx, query, nil)
		require.NoError(t, err)
		assert.Equal(t, want, got)
	})
}
