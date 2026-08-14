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
				_, _, err = db.QueryArrow(ctx, tt.query, nil, false)
			} else {
				_, _, err = db.QueryJSON(ctx, tt.query, nil, false)
			}

			require.ErrorContains(t, err, "use of function '"+tt.function+"' is not allowed")
		})
	}
}

func TestDB_FunctionAllowlist(t *testing.T) {
	ctx := context.Background()

	t.Run("allows exact case-insensitive function names", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist([]string{" MD5 ", "ROW_NUMBER", "RANGE", "+", "COUNT_STAR", "LIST_VALUE"}))

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
					_, _, err = db.QueryArrow(ctx, tt.query, nil, false)
				} else {
					_, _, err = db.QueryJSON(ctx, tt.query, nil, false)
				}
				require.NoError(t, err)
			})
		}
	})

	t.Run("rejects a function that is not listed", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist([]string{"md"}))

		_, _, err := db.QueryJSON(ctx, "SELECT md5('mosaic')", nil, false)
		require.ErrorIs(t, err, ErrAccessDenied)
		require.ErrorContains(t, err, "function 'md5' is not in the allowlist")
	})

	t.Run("rejects nested functions that are not listed", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist([]string{"md5"}))

		_, _, err := db.QueryJSON(ctx, "SELECT md5(lower('mosaic'))", nil, false)
		require.ErrorIs(t, err, ErrAccessDenied)
		require.ErrorContains(t, err, "function 'lower' is not in the allowlist")
	})

	t.Run("rejects non-main qualified allowed functions", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist([]string{"md5", "count_star"}))

		tests := []struct {
			query         string
			qualifiedName string
		}{
			{query: "SELECT tenant.md5('mosaic')", qualifiedName: "tenant.md5"},
			{query: "SELECT system.main.count(*) FROM (SELECT 1)", qualifiedName: "system.main.count_star"},
		}
		for _, tt := range tests {
			_, _, err := db.QueryJSON(ctx, tt.query, nil, false)
			require.ErrorIs(t, err, ErrAccessDenied)
			require.ErrorContains(t, err, "qualified function '"+tt.qualifiedName+"' is not allowed")
		}
	})

	t.Run("rejects parser helpers that are not listed", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist([]string{"read_parquet"}))

		_, _, err := db.QueryJSON(ctx, "SELECT * FROM read_parquet(['local.parquet'])", nil, false)
		require.ErrorIs(t, err, ErrAccessDenied)
		require.ErrorContains(t, err, "function 'list_value' is not in the allowlist")
	})

	t.Run("explicit empty allows function-free queries", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(nil))

		_, _, err := db.QueryJSON(ctx, "SELECT 1", nil, false)
		require.NoError(t, err)

		_, _, err = db.QueryJSON(ctx, "SELECT 1 + 2", nil, false)
		require.ErrorIs(t, err, ErrAccessDenied)
		require.ErrorContains(t, err, "function '+' is not in the allowlist")
	})
}

func TestDB_FunctionAllowlistHandlesUnsupportedStatements(t *testing.T) {
	db := setupTestDB(t, WithFunctionAllowlist(nil))

	_, _, err := db.QueryJSON(t.Context(), "PRAGMA version", nil, false)
	require.ErrorIs(t, err, ErrUnsupportedStatement)
	require.ErrorContains(t, err, "query: validation failed: query: not implemented: Only SELECT statements can be serialized to json")
}

func TestDB_FunctionBlocklistHandlesUnsupportedStatements(t *testing.T) {
	db := setupTestDB(t, WithFunctionBlocklist([]string{"range"}))
	ctx := context.Background()

	t.Run("JSON", func(t *testing.T) {
		_, _, err := db.QueryJSON(ctx, "PRAGMA version", nil, false)
		require.ErrorIs(t, err, ErrUnsupportedStatement)
		require.ErrorContains(t, err, "query: validation failed: query: not implemented: Only SELECT statements can be serialized to json")
		require.NotContains(t, err.Error(), "()")
		require.NotContains(t, err.Error(), " at :")
	})

	t.Run("Arrow", func(t *testing.T) {
		_, _, err := db.QueryArrow(ctx, "PRAGMA version", nil, false)
		require.ErrorIs(t, err, ErrUnsupportedStatement)
		require.ErrorContains(t, err, "query: validation failed: query: not implemented: Only SELECT statements can be serialized to json")
		require.NotContains(t, err.Error(), "()")
		require.NotContains(t, err.Error(), " at :")
	})
}

func TestDB_CacheValidatesSchemas(t *testing.T) {
	tests := []struct {
		name   string
		format string
	}{
		{name: "JSON", format: "json"},
		{name: "Arrow", format: "arrow"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)
			ctx := context.Background()

			err := db.Exec(ctx, `
				CREATE SCHEMA tenant_a;
				CREATE TABLE tenant_a.secret (value VARCHAR);
				INSERT INTO tenant_a.secret VALUES ('tenant-a-only')
			`)
			require.NoError(t, err)

			const query = "SELECT * FROM tenant_a.secret"
			if tt.format == "arrow" {
				_, fromCache, err := db.QueryArrow(ctx, query, []string{"tenant_a"}, true)
				require.NoError(t, err)
				assert.False(t, fromCache)

				_, fromCache, err = db.QueryArrow(ctx, query, []string{"tenant_b"}, true)
				require.ErrorContains(t, err, "unauthorized access to schema")
				assert.False(t, fromCache)

				_, fromCache, err = db.QueryArrow(ctx, query, []string{"tenant_a"}, true)
				require.NoError(t, err)
				assert.True(t, fromCache)
			} else {
				_, fromCache, err := db.QueryJSON(ctx, query, []string{"tenant_a"}, true)
				require.NoError(t, err)
				assert.False(t, fromCache)

				_, fromCache, err = db.QueryJSON(ctx, query, []string{"tenant_b"}, true)
				require.ErrorContains(t, err, "unauthorized access to schema")
				assert.False(t, fromCache)

				_, fromCache, err = db.QueryJSON(ctx, query, []string{"tenant_a"}, true)
				require.NoError(t, err)
				assert.True(t, fromCache)
			}
		})
	}
}

func TestDB_CacheSeparatesFormats(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()
	const query = "SELECT 42 AS answer"

	jsonData, fromCache, err := db.QueryJSON(ctx, query, nil, true)
	require.NoError(t, err)
	assert.False(t, fromCache)
	assert.True(t, json.Valid(jsonData))

	arrowData, fromCache, err := db.QueryArrow(ctx, query, nil, true)
	require.NoError(t, err)
	assert.False(t, fromCache)
	assert.False(t, json.Valid(arrowData))

	cachedJSON, fromCache, err := db.QueryJSON(ctx, query, nil, true)
	require.NoError(t, err)
	assert.True(t, fromCache)
	assert.Equal(t, jsonData, cachedJSON)

	cachedArrow, fromCache, err := db.QueryArrow(ctx, query, nil, true)
	require.NoError(t, err)
	assert.True(t, fromCache)
	assert.Equal(t, arrowData, cachedArrow)
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
		assert.EqualError(t, err, "query: exec command is disabled when schema or function validation is active")
	})

	t.Run("empty function allowlist rejects exec", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(nil))

		err := db.Exec(ctx, "SELECT 1")
		require.ErrorIs(t, err, ErrExecWithValidation)
		assert.EqualError(t, err, "query: exec command is disabled when schema or function validation is active")
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

	t.Run("simple select without cache", func(t *testing.T) {
		gotJSON, fromCache, err := db.QueryJSON(ctx, query, nil, false)
		require.NoError(t, err)
		assert.False(t, fromCache)

		// Verify JSON structure
		var got []map[string]any
		err = json.Unmarshal(gotJSON, &got)
		require.NoError(t, err)
		assert.Equal(t, want, got)
	})

	t.Run("query with cache", func(t *testing.T) {
		// First query: should not be from cache
		gotJSON, fromCache, err := db.QueryJSON(ctx, query, nil, true)
		require.NoError(t, err)
		assert.False(t, fromCache)

		var got []map[string]any
		err = json.Unmarshal(gotJSON, &got)
		require.NoError(t, err)
		assert.Equal(t, want, got)

		// Second query: should be from cache
		gotJSON, fromCache, err = db.QueryJSON(ctx, query, nil, true)
		require.NoError(t, err)
		assert.True(t, fromCache)

		err = json.Unmarshal(gotJSON, &got)
		require.NoError(t, err)
		assert.Equal(t, want, got)
	})

	t.Run("invalid query", func(t *testing.T) {
		_, _, err := db.QueryJSON(ctx, "SELECT * FROM nonexistent_table", nil, false)
		assert.Error(t, err)
	})

	t.Run("empty result set", func(t *testing.T) {
		result, fromCache, err := db.QueryJSON(ctx, "SELECT * FROM products WHERE id > 100", nil, false)
		require.NoError(t, err)
		assert.False(t, fromCache)

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

	t.Run("query arrow without cache", func(t *testing.T) {
		got, fromCache, err := db.QueryArrow(ctx, query, nil, false)
		require.NoError(t, err)
		assert.Equal(t, want, got)
		assert.False(t, fromCache)
	})

	t.Run("query arrow with cache", func(t *testing.T) {
		// First query
		got, fromCache, err := db.QueryArrow(ctx, query, nil, true)
		require.NoError(t, err)
		assert.Equal(t, want, got)
		assert.False(t, fromCache)

		// Second query should be from cache
		got, fromCache, err = db.QueryArrow(ctx, query, nil, true)
		require.NoError(t, err)
		assert.Equal(t, want, got)
		assert.True(t, fromCache)
	})
}
