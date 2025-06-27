package query

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"testing"

	"github.com/marcboeker/go-duckdb/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupTestDB creates a new in-memory DuckDB instance for testing
func setupTestDB(t *testing.T) *DB {
	t.Helper()

	ctx := context.Background()

	// Create an in-memory DuckDB connector
	connector, err := duckdb.NewConnector(":memory:", nil)
	require.NoError(t, err)

	// Create a test logger that discards output
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
		Level: slog.LevelError, // Only show errors during tests
	}))

	db, err := New(ctx, connector, 5, 100, logger)
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
		gotJSON, fromCache, err := db.QueryJSON(ctx, query, false)
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
		gotJSON, fromCache, err := db.QueryJSON(ctx, query, true)
		require.NoError(t, err)
		assert.False(t, fromCache)

		var got []map[string]any
		err = json.Unmarshal(gotJSON, &got)
		require.NoError(t, err)
		assert.Equal(t, want, got)

		// Second query: should be from cache
		gotJSON, fromCache, err = db.QueryJSON(ctx, query, true)
		require.NoError(t, err)
		assert.True(t, fromCache)

		err = json.Unmarshal(gotJSON, &got)
		require.NoError(t, err)
		assert.Equal(t, want, got)
	})

	t.Run("invalid query", func(t *testing.T) {
		_, _, err := db.QueryJSON(ctx, "SELECT * FROM nonexistent_table", false)
		assert.Error(t, err)
	})

	t.Run("empty result set", func(t *testing.T) {
		result, fromCache, err := db.QueryJSON(ctx, "SELECT * FROM products WHERE id > 100", false)
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
		got, fromCache, err := db.QueryArrow(ctx, query, false)
		require.NoError(t, err)
		assert.Equal(t, want, got)
		assert.False(t, fromCache)
	})

	t.Run("query arrow with cache", func(t *testing.T) {
		// First query
		got, fromCache, err := db.QueryArrow(ctx, query, true)
		require.NoError(t, err)
		assert.Equal(t, want, got)
		assert.False(t, fromCache)

		// Second query should be from cache
		got, fromCache, err = db.QueryArrow(ctx, query, true)
		require.NoError(t, err)
		assert.Equal(t, want, got)
		assert.True(t, fromCache)
	})
}
