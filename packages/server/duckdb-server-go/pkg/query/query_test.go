package query

import (
	"bytes"
	"database/sql/driver"
	"encoding/json"
	"testing"

	"github.com/apache/arrow-go/v18/arrow/ipc"
	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extensions"
)

func testConnector(t *testing.T, gatekeeper bool) *duckdb.Connector {
	t.Helper()
	connector, err := duckdb.NewConnector(":memory:?autoload_known_extensions=false&autoinstall_known_extensions=false", func(execer driver.ExecerContext) error {
		if gatekeeper {
			return extensions.InstallAndLoad(t.Context(), execer, "gatekeeper", "community")
		}
		return nil
	})
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, connector.Close()) })
	return connector
}

func setupTestDB(t *testing.T, gatekeeper bool, opts ...OptionFunc) *DB {
	t.Helper()
	db, err := New(t.Context(), testConnector(t, gatekeeper), opts...)
	require.NoError(t, err)
	t.Cleanup(db.Close)
	return db
}

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

func TestExecAndArrow(t *testing.T) {
	db := setupTestDB(t, false)
	require.NoError(t, db.Exec(t.Context(), `CREATE TABLE products (id INTEGER, name VARCHAR, price DECIMAL);
		INSERT INTO products VALUES (1, 'Apple', 1.50), (2, 'Banana', 0.75), (NULL, NULL, NULL)`))
	data, err := db.QueryArrow(t.Context(), "SELECT * FROM products ORDER BY id", nil)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{
		{"id": float64(1), "name": "Apple", "price": "1.5"},
		{"id": float64(2), "name": "Banana", "price": "0.75"},
		{"id": nil, "name": nil, "price": nil},
	}, arrowRows(t, data))
	data, err = db.QueryArrow(t.Context(), "SELECT * FROM products WHERE id > 100", nil)
	require.NoError(t, err)
	require.Empty(t, arrowRows(t, data))
	_, err = db.QueryArrow(t.Context(), "SELECT * FROM missing_table", nil)
	require.Error(t, err)
	require.Error(t, db.Exec(t.Context(), "INVALID SQL"))
}
