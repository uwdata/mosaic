package query

import (
	"bytes"
	"context"
	"database/sql/driver"
	"os"
	"path/filepath"
	"sync"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGatekeeperResolvedPolicy(t *testing.T) {
	db := setupValidationDB(t)
	require.NoError(t, db.Exec(t.Context(), `
		CREATE VIEW tenant_a.shared AS SELECT * FROM tenant_b.secret;
		CREATE VIEW tenant_a.safe AS SELECT * FROM tenant_a.secret;
		ATTACH ':memory:' AS otherdb; CREATE SCHEMA otherdb.tenant_a;
		CREATE TABLE otherdb.tenant_a.secret (value INTEGER);
		CREATE MACRO gatekeeper_validate(sql_text, blocked_functions := [], allowed_tables := [])
		AS TABLE SELECT true AS allowed, 'ok' AS code, [] AS violations;
	`))
	cases := []struct{ name, sql, rule string }{
		{"safe view", "SELECT * FROM tenant_a.safe", ""},
		{"trusted view underlying table", "SELECT * FROM tenant_a.shared", ""},
		{"caller underlying table beside view", "SELECT * FROM tenant_a.shared, tenant_b.secret", "table"},
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
		_, err := db.QueryArrow(t.Context(), "SELECT * FROM tenant_a.secret", &ValidationPolicy{AllowedSchemas: schemas})
		requireViolation(t, err, "table")
	}
}

func TestGatekeeperConnectionAndConcurrency(t *testing.T) {
	db := setupTestDB(t, WithMaxConnections(1))
	require.NoError(t, db.Exec(t.Context(), `CREATE SCHEMA tenant_a; CREATE TABLE tenant_a.items AS SELECT 42 AS value;
		SET search_path = 'tenant_a'`))
	tenantA := &ValidationPolicy{AllowedSchemas: []string{"tenant_a"}}
	tenantB := &ValidationPolicy{AllowedSchemas: []string{"tenant_b"}}
	data, err := db.QueryArrow(t.Context(), "SELECT * FROM items", tenantA)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"value": float64(42)}}, arrowRows(t, data))
	var buf bytes.Buffer
	err = db.WriteArrow(t.Context(), "SELECT * FROM items", tenantB, &buf)
	requireViolation(t, err, "table")
	require.Zero(t, buf.Len())
	ctx, cancel := context.WithCancel(t.Context())
	cancel()
	_, err = db.QueryArrow(ctx, "SELECT * FROM items", tenantA)
	require.ErrorIs(t, err, context.Canceled)
	var wg sync.WaitGroup
	for range 16 {
		wg.Go(func() {
			_, err := db.QueryArrow(t.Context(), "SELECT * FROM items", tenantA)
			if err != nil {
				t.Error(err)
			}
			_, err = db.QueryArrow(t.Context(), "SELECT * FROM items", tenantB)
			if err == nil {
				t.Error("unauthorized query allowed")
			}
		})
	}
	wg.Wait()
}

func TestGatekeeperMissingFailsClosed(t *testing.T) {
	noop := func(context.Context, driver.ExecerContext) error { return nil }

	t.Run("validation requires Gatekeeper at startup", func(t *testing.T) {
		connector := newTestConnector(t, testDSN, noop)
		db, err := New(t.Context(), connector, WithValidation())
		require.ErrorContains(t, err, "Gatekeeper is required for validation")
		require.Nil(t, db)
	})

	t.Run("request policies fail without Gatekeeper", func(t *testing.T) {
		db := setupTestDBWithInit(t, noop)
		data, err := db.QueryArrow(t.Context(), "SELECT 1", nil)
		require.NoError(t, err)
		require.NotEmpty(t, data)
		for _, policy := range []ValidationPolicy{{}, {AllowedSchemas: []string{"main"}}} {
			err := db.ValidateSQL(t.Context(), "SELECT 1", policy)
			require.ErrorIs(t, err, ErrValidation)
			require.ErrorContains(t, err, "gatekeeper_validate")
			_, err = db.QueryArrow(t.Context(), "SELECT 1", &policy)
			require.ErrorIs(t, err, ErrValidation)
		}
	})

	t.Run("incompatible validate function", func(t *testing.T) {
		db := setupTestDBWithInit(t, func(ctx context.Context, execer driver.ExecerContext) error {
			_, err := execer.ExecContext(ctx, "CREATE OR REPLACE MACRO gatekeeper_validate(sql_text) AS TABLE SELECT true AS allowed", nil)
			return err
		})
		err := db.ValidateSQL(t.Context(), "SELECT 1", ValidationPolicy{})
		require.ErrorIs(t, err, ErrValidation)
	})
}

func TestGatekeeperGlobalCeiling(t *testing.T) {
	db := setupValidationDB(t)
	require.NoError(t, db.Exec(t.Context(), `CALL gatekeeper_configure(
		allowed_tables := [{catalog: 'memory', schema: 'tenant_a', 'table': '*'}],
		blocked_functions := ['md5']); SET lock_configuration = true`))
	require.NoError(t, db.ValidateSQL(t.Context(), "SELECT * FROM tenant_a.secret", ValidationPolicy{}))
	requireViolation(t, db.ValidateSQL(t.Context(), "SELECT * FROM tenant_b.secret", ValidationPolicy{}), "table")
	requireViolation(t, db.ValidateSQL(t.Context(), "SELECT md5('x')", ValidationPolicy{AllowedFunctions: []string{"md5"}}), "function")
	require.Error(t, db.Exec(t.Context(), "CALL gatekeeper_configure()"))
}

func TestGatekeeperReaderAdmission(t *testing.T) {
	db := setupTestDB(t)
	path := filepath.Join(t.TempDir(), "values.csv")
	require.NoError(t, os.WriteFile(path, []byte("value\n42\n"), 0o600))
	stmt := "SELECT * FROM read_csv(" + quoteLiteral(path) + ")"
	readers := &ValidationPolicy{AllowedFunctions: []string{"read_csv", "read_csv_auto"}}
	_, err := db.QueryArrow(t.Context(), stmt, readers)
	requireViolation(t, err, "function")
	require.NoError(t, db.Exec(t.Context(), "CALL gatekeeper_configure(allowed_functions := ['read_csv', 'read_csv_auto'])"))
	for _, policy := range []*ValidationPolicy{readers, {AllowedSchemas: []string{}}} {
		for _, sql := range []string{stmt, "SELECT * FROM " + quoteLiteral(path)} {
			data, err := db.QueryArrow(t.Context(), sql, policy)
			require.NoError(t, err)
			require.Equal(t, []map[string]any{{"value": float64(42)}}, arrowRows(t, data))
		}
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

func TestGatekeeperTrustedDefinitions(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, db.Exec(t.Context(), `CREATE VIEW hashed AS SELECT md5('secret') AS hash;
		CREATE MACRO digest(x) AS md5(x);
		CREATE VIEW metadata AS SELECT table_name FROM duckdb_tables();
		CALL gatekeeper_configure(allowed_functions := ['digest'], blocked_functions := ['md5', 'sum'])`))
	policy := ValidationPolicy{BlockedFunctions: []string{"md5", "sum"}, AllowedFunctions: []string{"digest"}}
	for _, stmt := range []string{"SELECT * FROM hashed", "SELECT digest('x')", "SELECT * FROM metadata"} {
		_, err := db.QueryArrow(t.Context(), stmt, &policy)
		require.NoError(t, err, stmt)
	}
	for _, stmt := range []string{"SELECT md5('x') FROM hashed", "SELECT digest('x'), md5('x')", "SELECT list_sum([1, 2])", "SELECT * FROM duckdb_tables()"} {
		err := db.ValidateSQL(t.Context(), stmt, policy)
		requireViolation(t, err, "function")
	}
}

func TestGatekeeperControlPlaneThroughTrustedDefinitions(t *testing.T) {
	db := setupTestDB(t)
	for _, name := range []string{"gatekeeper_configure", "gatekeeper_enforce", "disable_logging", "truncate_duckdb_logs"} {
		t.Run(name, func(t *testing.T) {
			require.NoError(t, db.Exec(t.Context(), "CREATE OR REPLACE VIEW control AS SELECT * FROM "+name+"()"))
			err := db.ValidateSQL(t.Context(), "SELECT * FROM control", ValidationPolicy{AllowedFunctions: []string{name}})
			requireViolation(t, err, "function")
		})
	}
}

func TestGatekeeperTrustedViewTableBlocks(t *testing.T) {
	db := setupValidationDB(t)
	require.NoError(t, db.Exec(t.Context(), `INSERT INTO tenant_b.secret VALUES (42);
		CREATE VIEW tenant_a.shared AS SELECT * FROM tenant_b.secret;
		CALL gatekeeper_configure(blocked_tables := [{schema: 'tenant_b', 'table': 'secret'}])`))
	policy := &ValidationPolicy{AllowedSchemas: []string{"tenant_a"}}
	data, err := db.QueryArrow(t.Context(), "SELECT * FROM tenant_a.shared", policy)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"value": float64(42)}}, arrowRows(t, data))
	_, err = db.QueryArrow(t.Context(), "SELECT * FROM tenant_a.shared, tenant_b.secret", &ValidationPolicy{})
	requireViolation(t, err, "table")
	require.NoError(t, db.Exec(t.Context(), `CALL gatekeeper_configure(blocked_tables := [{schema: 'tenant_a', 'table': 'shared'}])`))
	_, err = db.QueryArrow(t.Context(), "SELECT * FROM tenant_a.shared", policy)
	requireViolation(t, err, "table")
}
