package query

import (
	"bytes"
	"context"
	"net/url"
	"os"
	"path/filepath"
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
		CREATE MACRO gatekeeper_validate(sql_text, blocked_functions := [], allowed_tables := [])
		AS TABLE SELECT true AS allowed, 'ok' AS code, [] AS violations;
	`))
	cases := []struct{ name, sql, rule string }{
		{"safe view", "SELECT * FROM tenant_a.safe", ""},
		{"view underlying table", "SELECT * FROM tenant_a.leak", "table"},
		{"out of scope CTE", "WITH c AS (WITH secret AS (SELECT 1) SELECT * FROM secret) SELECT * FROM secret", "table"},
		{"attached catalog", "SELECT * FROM otherdb.tenant_a.secret", "table"},
		{"qualified primary catalog", "SELECT * FROM memory.tenant_a.secret", ""},
		{"reader", "SELECT * FROM read_csv('/missing.csv')", "function"},
		{"replacement", "SELECT * FROM 'missing.parquet'", "function"},
		{"metadata", "SELECT * FROM duckdb_tables()", "function"},
		{"configure", "SELECT * FROM gatekeeper_configure()", "function"},
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
		requireViolation(t, err, "table")
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
	requireViolation(t, err, "table")
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
	installed := setupTestDB(t)
	var path string
	require.NoError(t, installed.db.QueryRowContext(t.Context(), "SELECT install_path FROM duckdb_extensions() WHERE extension_name = 'gatekeeper'").Scan(&path))
	for _, source := range []string{"gatekeeper", path} {
		t.Run("preinstalled "+source, func(t *testing.T) {
			connector, err := duckdb.NewConnector(":memory:?allow_community_extensions=true&autoinstall_known_extensions=false", nil)
			require.NoError(t, err)
			t.Cleanup(func() { require.NoError(t, connector.Close()) })
			db, err := New(t.Context(), connector, WithGatekeeperExtension(source))
			require.NoError(t, err)
			t.Cleanup(db.Close)
			require.NoError(t, db.ValidateSQL(t.Context(), "SELECT 1", ValidationPolicy{}))
		})
	}
	artifact, err := os.ReadFile(path)
	require.NoError(t, err)
	require.Greater(t, len(artifact), 256)
	clear(artifact[len(artifact)-256:])
	unsigned := filepath.Join(t.TempDir(), "gatekeeper.duckdb_extension")
	require.NoError(t, os.WriteFile(unsigned, artifact, 0o600))
	for _, tc := range []struct{ name, dsn, path string }{
		{"unsigned rejected", ":memory:", unsigned},
		{"missing artifact", ":memory:", filepath.Join(t.TempDir(), "missing.duckdb_extension")},
		{"community extensions disabled", ":memory:?allow_community_extensions=false", path},
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

func TestGatekeeperCommunityInstall(t *testing.T) {
	connector, err := duckdb.NewConnector(":memory:?extension_directory="+url.QueryEscape(t.TempDir()), nil)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, connector.Close()) })
	db, err := New(t.Context(), connector)
	require.NoError(t, err)
	t.Cleanup(db.Close)
	var repository string
	var unsigned bool
	require.NoError(t, db.db.QueryRowContext(t.Context(), "SELECT installed_from FROM duckdb_extensions() WHERE extension_name = 'gatekeeper'").Scan(&repository))
	require.Equal(t, "community", repository)
	require.NoError(t, db.db.QueryRowContext(t.Context(), "SELECT current_setting('allow_unsigned_extensions')").Scan(&unsigned))
	require.False(t, unsigned)
	require.NoError(t, db.ValidateSQL(t.Context(), "SELECT 1", ValidationPolicy{}))
}

func TestGatekeeperIncompatibleAPIFailsStartup(t *testing.T) {
	connector, err := duckdb.NewConnector(":memory:", nil)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, connector.Close()) })
	db, err := New(t.Context(), connector, WithGatekeeperExtension("json"))
	require.ErrorContains(t, err, "incompatible Gatekeeper API")
	require.Nil(t, db)
}

func TestGatekeeperGlobalCeiling(t *testing.T) {
	db := setupValidationDB(t)
	require.NoError(t, db.Exec(t.Context(), `CALL gatekeeper_configure(
		allowed_tables := [{catalog: 'memory', schema: 'tenant_a', 'table': '*'}],
		blocked_functions := ['md5']); SET lock_configuration = true`))
	require.NoError(t, db.ValidateSQL(t.Context(), "SELECT * FROM tenant_a.secret", ValidationPolicy{}))
	requireViolation(t, db.ValidateSQL(t.Context(), "SELECT * FROM tenant_b.secret", ValidationPolicy{}), "table")
	requireViolation(t, db.ValidateSQL(t.Context(), "SELECT md5('x')", ValidationPolicy{
		FunctionAllowlist: &FunctionAllowlistOptions{Include: []string{"md5"}},
	}), "function")
	require.Error(t, db.Exec(t.Context(), "CALL gatekeeper_configure()"))
}

func TestGatekeeperReaderAdmission(t *testing.T) {
	db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{Include: []string{"read_csv", "read_csv_auto"}}))
	path := filepath.Join(t.TempDir(), "values.csv")
	require.NoError(t, os.WriteFile(path, []byte("value\n42\n"), 0o600))
	stmt := "SELECT * FROM read_csv(" + quoteLiteral(path) + ")"
	_, err := db.QueryArrow(t.Context(), stmt, nil)
	requireViolation(t, err, "function")
	_, err = db.db.ExecContext(t.Context(), "CALL gatekeeper_configure(allowed_functions := ['read_csv', 'read_csv_auto'])")
	require.NoError(t, err)
	for _, sql := range []string{stmt, "SELECT * FROM " + quoteLiteral(path)} {
		data, err := db.QueryArrow(t.Context(), sql, []string{})
		require.NoError(t, err)
		require.Equal(t, []map[string]any{{"value": float64(42)}}, arrowRows(t, data))
	}
}

func TestGatekeeperExactSchemaPolicy(t *testing.T) {
	db := setupValidationDB(t)
	for _, schemas := range [][]string{nil, {"TENANT_A"}} {
		require.NoError(t, db.ValidateSQL(t.Context(), "SELECT * FROM tenant_a.secret", ValidationPolicy{AllowedSchemas: schemas}))
	}
	requireViolation(t, db.ValidateSQL(t.Context(), "SELECT * FROM tenant_a.secret", ValidationPolicy{AllowedSchemas: []string{}}), "table")
	err := db.ValidateSQL(t.Context(), "SELECT * FROM tenant_b.secret", ValidationPolicy{AllowedSchemas: []string{"*"}})
	var details ErrorDetails
	require.ErrorAs(t, err, &details)
	require.Equal(t, "invalid_input", details.Code)
	require.NoError(t, db.Exec(t.Context(), `CREATE TEMP TABLE secret (value INTEGER)`))
	require.Equal(t, "temp", requireViolation(t, db.ValidateSQL(t.Context(), "SELECT * FROM secret", ValidationPolicy{AllowedSchemas: []string{"main"}}), "table").Catalog)
}

func TestGatekeeperFunctionNamespaces(t *testing.T) {
	db := setupValidationDB(t)
	require.NoError(t, db.Exec(t.Context(), `ATTACH ':memory:' AS otherdb;
		CREATE SCHEMA otherdb.tenant_a;
		CREATE MACRO otherdb.tenant_a.md5(x) AS system.main.md5(x)`))
	require.NoError(t, db.ValidateSQL(t.Context(), "SELECT otherdb.tenant_a.md5('x')", ValidationPolicy{AllowedSchemas: []string{}}))
	err := db.ValidateSQL(t.Context(), "SELECT * FROM otherdb.tenant_a.missing()", ValidationPolicy{AllowedSchemas: []string{}})
	requireViolation(t, err, "function")
}

func TestGatekeeperBlocksTrustedExpansions(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, db.Exec(t.Context(), `CREATE VIEW hashed AS SELECT md5('secret') AS hash;
		CREATE MACRO digest(x) AS md5(x)`))
	for _, sql := range []string{"SELECT * FROM hashed", "SELECT digest('x')", "SELECT list_sum([1, 2])"} {
		err := db.ValidateSQL(t.Context(), sql, ValidationPolicy{
			BlockedFunctions:  []string{"md5", "sum"},
			FunctionAllowlist: &FunctionAllowlistOptions{Include: []string{"digest"}},
		})
		requireViolation(t, err, "function")
	}
}
