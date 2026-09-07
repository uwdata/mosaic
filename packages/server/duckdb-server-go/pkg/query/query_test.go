package query

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupTestDB creates a new in-memory DuckDB instance for testing
func setupTestDB(t *testing.T, opts ...OptionFunc) *DB {
	t.Helper()

	ctx := context.Background()

	// Create an in-memory DuckDB connector
	connector, err := duckdb.NewConnector(":memory:", nil)
	require.NoError(t, err)

	// Create a test logger that discards output
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
		Level: slog.LevelError, // Only show errors during tests
	}))

	opts = append([]OptionFunc{WithLogger(logger)}, opts...)
	db, err := New(ctx, connector, opts...)
	require.NoError(t, err)

	// Clean up when test completes
	t.Cleanup(func() {
		db.Close()
		err = connector.Close()
		if err != nil {
			t.Logf("Error closing DuckDB connector: %v", err)
		}
	})

	return db
}

func TestDB_FunctionBlocklist(t *testing.T) {
	db := setupTestDB(t, WithFunctionBlocklist([]string{" RANGE ", "MD5", "SUM", "ROW_NUMBER"}))
	ctx := context.Background()

	tests := []struct {
		name     string
		function string
		query    string
		format   string
	}{
		{
			name:     "JSON table function",
			function: "range",
			query:    "SELECT * FROM range(3)",
			format:   "json",
		},
		{
			name:     "JSON scalar function",
			function: "md5",
			query:    "SELECT md5('mosaic')",
			format:   "json",
		},
		{
			name:     "JSON window aggregate",
			function: "sum",
			query:    "SELECT sum(i) OVER () FROM (VALUES (1), (2), (3)) t(i)",
			format:   "json",
		},
		{
			name:     "JSON window function",
			function: "row_number",
			query:    "SELECT row_number() OVER ()",
			format:   "json",
		},
		{
			name:     "Arrow table function",
			function: "range",
			query:    "SELECT * FROM range(3)",
			format:   "arrow",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var err error
			if tt.format == "arrow" {
				_, err = db.QueryArrow(ctx, tt.query, nil)
			} else {
				_, err = db.QueryJSON(ctx, tt.query, nil)
			}

			require.ErrorContains(t, err, "use of function '"+tt.function+"' is not allowed")
		})
	}
}

func TestDB_FunctionAllowlist(t *testing.T) {
	ctx := context.Background()

	t.Run("allows exact case-insensitive function names", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{
			DisableDefaults: true,
			Include:         []string{" MD5 ", "ROW_NUMBER", "RANGE", "+", "COUNT_STAR", "LIST_VALUE"},
		}))

		tests := []struct {
			name   string
			query  string
			format string
		}{
			{name: "scalar function", query: "SELECT md5('mosaic')", format: "json"},
			{name: "window function", query: "SELECT row_number() OVER ()", format: "json"},
			{name: "operator", query: "SELECT 1 + 2", format: "json"},
			{name: "Arrow table function", query: "SELECT * FROM range(3)", format: "arrow"},
			{name: "normalized function name", query: "SELECT count(*)", format: "json"},
			{name: "main-qualified function", query: "SELECT main.md5('mosaic')", format: "json"},
			{name: "main-qualified normalized function", query: "SELECT main.count(*) FROM (SELECT 1)", format: "json"},
			{name: "helper over qualified column", query: "SELECT [main.x] FROM (SELECT 1 AS x) AS main", format: "json"},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				var err error
				if tt.format == "arrow" {
					_, err = db.QueryArrow(ctx, tt.query, nil)
				} else {
					_, err = db.QueryJSON(ctx, tt.query, nil)
				}
				require.NoError(t, err)
			})
		}
	})

	t.Run("rejects a function that is not listed", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{
			DisableDefaults: true,
			Include:         []string{"md"},
		}))

		_, err := db.QueryJSON(ctx, "SELECT md5('mosaic')", nil)
		require.ErrorIs(t, err, ErrAccessDenied)
		require.ErrorContains(t, err, "function 'md5' is not in the allowlist")
	})

	t.Run("rejects nested functions that are not listed", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{
			DisableDefaults: true,
			Include:         []string{"md5"},
		}))

		_, err := db.QueryJSON(ctx, "SELECT md5(lower('mosaic'))", nil)
		require.ErrorIs(t, err, ErrAccessDenied)
		require.ErrorContains(t, err, "function 'lower' is not in the allowlist")
	})

	t.Run("matches qualified functions by leaf name", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{
			DisableDefaults: true,
			Include:         []string{"md5", "count_star"},
		}))

		for _, query := range []string{
			"SELECT tenant.md5('mosaic')",
			"SELECT system.main.count(*) FROM (SELECT 1)",
		} {
			require.NoError(t, db.validateQuery(ctx, query, nil))
		}
	})

	t.Run("rejects parser helpers that are not listed", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{
			DisableDefaults: true,
			Include:         []string{"read_parquet"},
		}))

		_, err := db.QueryJSON(ctx, "SELECT * FROM read_parquet(['local.parquet'])", nil)
		require.ErrorIs(t, err, ErrAccessDenied)
		require.ErrorContains(t, err, "function 'list_value' is not in the allowlist")
	})

	t.Run("defaults allow common expressions", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{}))

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
		} {
			_, err := db.QueryJSON(ctx, query, nil)
			require.NoError(t, err, query)
		}
	})

	t.Run("defaults classify extension functions before binding", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{}))

		for _, query := range []string{
			"SELECT st_x(st_point(1, 2))",
			"SELECT json_serialize_sql('SELECT 1')",
			"SELECT iceberg_bucket(16, 'value')",
		} {
			require.NoError(t, db.validateQuery(ctx, query, nil), query)
		}

		for function, query := range map[string]string{
			"json_execute_serialized_sql": "SELECT * FROM json_execute_serialized_sql('{}')",
			"st_read":                     "SELECT * FROM st_read('data.geojson')",
			"st_transform":                "SELECT st_transform(NULL, 'EPSG:4326', 'EPSG:3857')",
		} {
			err := db.validateQuery(ctx, query, nil)
			require.ErrorIs(t, err, ErrAccessDenied)
			require.ErrorContains(t, err, "function '"+function+"' is not in the allowlist")
		}
	})

	t.Run("defaults reject unsafe name collisions", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{}))

		_, err := db.QueryJSON(ctx, "SELECT * FROM histogram('duckdb_tables', 'table_name')", nil)
		require.ErrorIs(t, err, ErrAccessDenied)
		require.ErrorContains(t, err, "function 'histogram' is not in the allowlist")
	})

	t.Run("defaults reject privileged functions", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{}))

		tests := []struct {
			function string
			query    string
		}{
			{function: "query", query: "SELECT * FROM query('SELECT 1')"},
			{function: "ago", query: "SELECT ago(INTERVAL 1 DAY)"},
			{function: "list_aggr", query: "SELECT list_aggr([1, 2], 'sum')"},
			{function: "list_aggregate", query: "SELECT list_aggregate([1, 2], 'sum')"},
			{function: "read_parquet", query: "SELECT * FROM read_parquet('missing.parquet')"},
			{function: "getenv", query: "SELECT getenv('HOME')"},
			{function: "pg_sleep", query: "SELECT pg_sleep(0)"},
			{function: "sleep_ms", query: "SELECT sleep_ms(1)"},
			{function: "random", query: "SELECT random()"},
			{function: "getenv", query: "SELECT list_transform(['HOME'], x -> getenv(x))"},
		}

		for _, tt := range tests {
			t.Run(tt.function, func(t *testing.T) {
				_, err := db.QueryJSON(ctx, tt.query, nil)
				require.ErrorIs(t, err, ErrAccessDenied)
				require.ErrorContains(t, err, "function '"+tt.function+"' is not in the allowlist")
			})
		}
	})

	t.Run("defaults can be disabled", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{DisableDefaults: true}))

		_, err := db.QueryJSON(ctx, "SELECT 1", nil)
		require.NoError(t, err)

		_, err = db.QueryJSON(ctx, "SELECT 1 + 2", nil)
		require.ErrorIs(t, err, ErrAccessDenied)
		require.ErrorContains(t, err, "function '+' is not in the allowlist")
	})

	t.Run("defaults can be excluded", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{
			Exclude: []string{" SUM "},
		}))

		_, err := db.QueryJSON(ctx, "SELECT 1 + 2", nil)
		require.NoError(t, err)

		_, err = db.QueryJSON(ctx, "SELECT sum(i) FROM (VALUES (1), (2)) t(i)", nil)
		require.ErrorIs(t, err, ErrAccessDenied)
		require.ErrorContains(t, err, "function 'sum' is not in the allowlist")
	})
}

func TestDB_FunctionAllowlistHandlesUnsupportedStatements(t *testing.T) {
	db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{}))

	_, err := db.QueryJSON(t.Context(), "PRAGMA version", nil)
	require.ErrorIs(t, err, ErrUnsupportedStatement)
	require.ErrorContains(t, err, "query: validation failed: query: not implemented: Only SELECT statements can be serialized to json")
}

func TestDB_FunctionBlocklistHandlesUnsupportedStatements(t *testing.T) {
	db := setupTestDB(t, WithFunctionBlocklist([]string{"range"}))
	ctx := context.Background()

	t.Run("JSON", func(t *testing.T) {
		_, err := db.QueryJSON(ctx, "PRAGMA version", nil)
		require.ErrorIs(t, err, ErrUnsupportedStatement)
		require.ErrorContains(t, err, "query: validation failed: query: not implemented: Only SELECT statements can be serialized to json")
		require.NotContains(t, err.Error(), "()")
		require.NotContains(t, err.Error(), " at :")
	})

	t.Run("Arrow", func(t *testing.T) {
		_, err := db.QueryArrow(ctx, "PRAGMA version", nil)
		require.ErrorIs(t, err, ErrUnsupportedStatement)
		require.ErrorContains(t, err, "query: validation failed: query: not implemented: Only SELECT statements can be serialized to json")
		require.NotContains(t, err.Error(), "()")
		require.NotContains(t, err.Error(), " at :")
	})
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

	t.Run("function validation rejects exec", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionBlocklist([]string{"range"}))

		err := db.Exec(ctx, "SELECT 1")
		require.ErrorIs(t, err, ErrExecWithValidation)
		assert.EqualError(t, err, "query: exec command is disabled when query validation is active")
	})

	t.Run("function allowlist rejects exec", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{}))

		err := db.Exec(ctx, "SELECT 1")
		require.ErrorIs(t, err, ErrExecWithValidation)
		assert.EqualError(t, err, "query: exec command is disabled when query validation is active")
	})
}

func TestDB_QueryJSON(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	// Setup test data
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
		gotJSON, err := db.QueryJSON(ctx, query, nil)
		require.NoError(t, err)

		// Verify JSON structure
		var got []map[string]any
		err = json.Unmarshal(gotJSON, &got)
		require.NoError(t, err)
		assert.Equal(t, want, got)
	})

	t.Run("invalid query", func(t *testing.T) {
		_, err := db.QueryJSON(ctx, "SELECT * FROM nonexistent_table", nil)
		assert.Error(t, err)
	})

	t.Run("empty result set", func(t *testing.T) {
		result, err := db.QueryJSON(ctx, "SELECT * FROM products WHERE id > 100", nil)
		require.NoError(t, err)

		var data []any
		err = json.Unmarshal(result, &data)
		require.NoError(t, err)
		assert.Len(t, data, 0)
		assert.Equal(t, "[]", string(result))
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
