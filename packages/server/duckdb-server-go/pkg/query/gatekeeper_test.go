package query

import (
	"bytes"
	"context"
	"os"
	"sync"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/require"
)

func TestGatekeeperResolvedPolicy(t *testing.T) {
	db := setupValidationDB(t)
	require.NoError(t, db.Exec(t.Context(), `
		CREATE VIEW tenant_a.leak AS SELECT * FROM tenant_b.secret;
		CREATE VIEW tenant_a.safe AS SELECT * FROM tenant_a.secret;
		ATTACH ':memory:' AS otherdb; CREATE SCHEMA otherdb.tenant_a;
		CREATE TABLE otherdb.tenant_a.secret (value INTEGER);
		CREATE MACRO gatekeeper_validate(sql_text, blocked_functions := [], allowed_catalogs := [], allowed_schemas := [])
		AS {'allowed': true, 'code': 'ok', 'violations': []};
	`))
	cases := []struct{ name, sql, rule string }{
		{"safe view", "SELECT * FROM tenant_a.safe", ""},
		{"view underlying table", "SELECT * FROM tenant_a.leak", "schema"},
		{"out of scope CTE", "WITH c AS (WITH secret AS (SELECT 1) SELECT * FROM secret) SELECT * FROM secret", "schema"},
		{"attached catalog", "SELECT * FROM otherdb.tenant_a.secret", "catalog"},
		{"qualified primary catalog", "SELECT * FROM memory.tenant_a.secret", ""},
		{"reader", "SELECT * FROM read_csv('/missing.csv')", "function"},
		{"replacement", "SELECT * FROM 'missing.parquet'", "file_table"},
		{"metadata", "SELECT * FROM duckdb_tables()", "function"},
		{"configure", "SELECT gatekeeper_configure(check_functions := false)", "function"},
		{"batch", "SELECT 1; SELECT 2", "limit"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := db.ValidateSQL(t.Context(), tc.sql, ValidationPolicy{AllowedSchemas: []string{"tenant_a"}})
			if tc.rule == "" {
				require.NoError(t, err)
			} else {
				requireViolation(t, err, tc.rule)
			}
		})
	}
	for _, schemas := range [][]string{{}, {"tenant_a'])); SELECT 1; --"}} {
		_, err := db.QueryArrow(t.Context(), "SELECT * FROM tenant_a.secret", schemas)
		requireViolation(t, err, "schema")
	}
}

func TestGatekeeperConnectionAndConcurrency(t *testing.T) {
	db := setupTestDB(t, WithMaxConnections(1))
	require.NoError(t, db.Exec(t.Context(), `CREATE SCHEMA tenant_a; CREATE TABLE tenant_a.items AS SELECT 42 AS value;
		SET search_path = 'tenant_a'`))
	data, err := db.QueryArrow(t.Context(), "SELECT * FROM items", []string{"tenant_a"})
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"value": float64(42)}}, arrowRows(t, data))
	var buf bytes.Buffer
	err = db.WriteArrow(t.Context(), "SELECT * FROM items", []string{"tenant_b"}, &buf)
	requireViolation(t, err, "schema")
	require.Zero(t, buf.Len())
	ctx, cancel := context.WithCancel(t.Context())
	cancel()
	_, err = db.QueryArrow(ctx, "SELECT * FROM items", []string{"tenant_a"})
	require.ErrorIs(t, err, context.Canceled)
	var wg sync.WaitGroup
	for range 16 {
		wg.Go(func() {
			_, err := db.QueryArrow(t.Context(), "SELECT * FROM items", []string{"tenant_a"})
			if err != nil {
				t.Error(err)
			}
			_, err = db.QueryArrow(t.Context(), "SELECT * FROM items", []string{"tenant_b"})
			if err == nil {
				t.Error("unauthorized query allowed")
			}
		})
	}
	wg.Wait()
}

func TestGatekeeperLoadFailsClosed(t *testing.T) {
	path := os.Getenv("GATEKEEPER_EXTENSION")
	require.NotEmpty(t, path)
	for _, tc := range []struct{ name, dsn, path string }{
		{"unsigned rejected", ":memory:", path},
		{"missing artifact", ":memory:?allow_unsigned_extensions=true", t.TempDir() + "/missing.duckdb_extension"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			connector, err := duckdb.NewConnector(tc.dsn, nil)
			require.NoError(t, err)
			t.Cleanup(func() { require.NoError(t, connector.Close()) })
			db, err := New(t.Context(), connector, WithGatekeeperExtension(tc.path))
			require.ErrorContains(t, err, "failed to load Gatekeeper")
			require.Nil(t, db)
		})
	}
}
