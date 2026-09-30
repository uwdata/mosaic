package query

import (
	"context"
	"database/sql/driver"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/require"
)

func TestPolicyDocument(t *testing.T) {
	for _, tc := range []struct {
		policy ValidationPolicy
		want   string
	}{
		{ValidationPolicy{}, `{"version":2,"options":{}}`},
		{ValidationPolicy{AllowedTables: []TableRule{}}, `{"version":2,"options":{"allowed_tables":[]}}`},
		{ValidationPolicy{AllowedFunctions: []FunctionRule{}, BlockedFunctions: []FunctionRule{}, UseDefaultFunctions: boolPtr(false)}, `{"version":2,"options":{"allowed_functions":[],"blocked_functions":[],"use_default_functions":false}}`},
		{ValidationPolicy{AllowedTables: []TableRule{{SchemaPath: []string{"a"}, Table: "*"}}}, `{"version":2,"options":{"allowed_tables":[{"schema_path":["a"],"table":"*"}]}}`},
		{ValidationPolicy{BlockedTables: []TableRule{{Catalog: stringPtr(""), SchemaPath: []string{"a", "b"}, Table: "*"}}, UseDefaultFunctions: boolPtr(true)}, `{"version":2,"options":{"blocked_tables":[{"catalog":"","schema_path":["a","b"],"table":"*"}],"use_default_functions":true}}`},
		{ValidationPolicy{BlockedFunctions: []FunctionRule{{Catalog: stringPtr("system"), SchemaPath: []string{"main"}, Name: "md5", Type: "scalar"}, {SchemaPath: []string{"main"}, Name: "sum"}}}, `{"version":2,"options":{"blocked_functions":[{"catalog":"system","schema_path":["main"],"name":"md5","type":"scalar"},{"schema_path":["main"],"name":"sum"}]}}`},
	} {
		got, err := tc.policy.document()
		require.NoError(t, err)
		require.JSONEq(t, tc.want, got)
	}
	const raw = "  {\"version\":2,\"options\":{\"allowed_tables\":null}}  "
	got, err := (ValidationPolicy{JSON: stringPtr(raw)}).document()
	require.NoError(t, err)
	require.Equal(t, raw, got)
	_, err = (ValidationPolicy{JSON: stringPtr(raw), BlockedTables: []TableRule{}}).document()
	require.ErrorIs(t, err, ErrInvalidPolicy)
}

func TestValidationRequiresGatekeeper(t *testing.T) {
	db, err := New(t.Context(), testConnector(t, false), WithValidation())
	require.ErrorContains(t, err, "JSON policy v2 (0.4.0+)")
	require.ErrorContains(t, err, "FORCE INSTALL gatekeeper FROM community")
	require.Nil(t, db)
	db = setupTestDB(t, false)
	_, err = db.ValidateSQL(t.Context(), "SELECT 1", ValidationPolicy{})
	require.ErrorIs(t, err, ErrValidation)
	data, err := db.Query(t.Context(), "SELECT 1", &ValidationPolicy{})
	require.ErrorIs(t, err, ErrValidation)
	require.Empty(t, data)
}

func TestValidationReportsInitializationFailures(t *testing.T) {
	failure := errors.New("initialization failed")
	connector, err := duckdb.NewConnector(":memory:", func(driver.ExecerContext) error { return failure })
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, connector.Close()) })
	db, err := New(t.Context(), connector, WithValidation())
	require.ErrorIs(t, err, failure)
	require.NotContains(t, err.Error(), "JSON policy v2 (0.4.0+)")
	require.Nil(t, db)
}

func TestGatekeeperCallsIgnoreShadowingMacros(t *testing.T) {
	connector := testConnector(t, true)
	db, err := New(t.Context(), connector)
	require.NoError(t, err)
	t.Cleanup(db.Close)
	require.NoError(t, db.Exec(t.Context(), `
		CREATE MACRO gatekeeper_validate(sql_text, json := '') AS TABLE
		SELECT true AS allowed, 'ok' AS code, '' AS error_type, '' AS error_message,
		       NULL::BIGINT AS position, [] AS violations, [] AS objects, [] AS functions, [] AS caller_objects, [] AS caller_functions;
		CREATE MACRO gatekeeper_configure(json := '') AS TABLE SELECT true AS Success;
	`))
	conn, err := connector.Connect(t.Context())
	require.NoError(t, err)
	defer func() { require.NoError(t, conn.Close()) }()
	require.NoError(t, ConfigureGatekeeper(t.Context(), conn.(driver.ExecerContext), `{"version":2,"options":{"blocked_functions":[{"catalog":"system","schema_path":["main"],"name":"md5"}]}}`))
	_, err = db.ValidateSQL(t.Context(), "SELECT md5('x')", ValidationPolicy{})
	require.ErrorIs(t, err, ErrAccessDenied)
}

func TestValidationPolicyAndResult(t *testing.T) {
	db := setupTestDB(t, true)
	require.NoError(t, db.Exec(t.Context(), `CREATE TABLE items AS SELECT 42 AS value;
		CREATE VIEW shared AS SELECT * FROM items;
		CALL gatekeeper_configure(blocked_functions := [{catalog: 'system', schema_path: ['main'], name: 'md5'}])`))
	policy := ValidationPolicy{AllowedTables: []TableRule{{SchemaPath: []string{"main"}, Table: "shared"}}}
	result, err := db.ValidateSQL(t.Context(), "SELECT sum(value) FROM shared", policy)
	require.NoError(t, err)
	require.True(t, result.Allowed)
	require.NotImplements(t, (*error)(nil), result)
	require.Equal(t, "ok", result.Details.Code)
	view := ResolvedObject{Catalog: "memory", SchemaPath: []string{"main"}, Table: "shared", Type: "view"}
	table := ResolvedObject{Catalog: "memory", SchemaPath: []string{"main"}, Table: "items", Type: "table"}
	require.Equal(t, []ResolvedObject{view}, result.CallerObjects)
	require.ElementsMatch(t, []ResolvedObject{view, table}, result.Objects)
	sum := ResolvedFunction{Catalog: "system", SchemaPath: []string{"main"}, Name: "sum", Type: "aggregate"}
	require.Contains(t, result.Functions, sum)
	require.Contains(t, result.CallerFunctions, sum)
	policy.AllowedFunctions = []FunctionRule{{Catalog: stringPtr("system"), SchemaPath: []string{"main"}, Name: "sum"}}
	policy.UseDefaultFunctions = boolPtr(false)
	_, err = db.Query(t.Context(), "SELECT sum(value) FROM shared", &policy)
	require.NoError(t, err)
	_, err = db.Query(t.Context(), "SELECT lower('x') FROM shared", &policy)
	require.ErrorIs(t, err, ErrAccessDenied)

	data, err := db.Query(t.Context(), "SELECT * FROM shared", &ValidationPolicy{JSON: stringPtr(`{"version":2,"options":{"allowed_tables":[{"schema_path":["main"],"table":"shared"}]}}`)})
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"value": float64(42)}}, arrowRows(t, data))
	result, err = db.ValidateSQL(t.Context(), "SELECT * FROM items", policy)
	require.ErrorIs(t, err, ErrAccessDenied)
	require.ErrorIs(t, err, ErrValidation)
	require.False(t, result.Allowed)
	require.Empty(t, result.Objects)
	require.Empty(t, result.CallerObjects)
	require.Empty(t, result.Functions)
	var details ErrorDetails
	require.ErrorAs(t, err, &details)
	require.Len(t, details.Violations, 1)
	require.Equal(t, "table", details.Violations[0].Rule)
	require.Equal(t, table.Catalog, details.Violations[0].Catalog)
	require.Equal(t, table.SchemaPath, details.Violations[0].SchemaPath)
	require.Equal(t, table.Table, details.Violations[0].Table)
	require.Equal(t, table.Type, details.Violations[0].ObjectType)
	_, err = db.Query(t.Context(), "SELECT md5('x')", &ValidationPolicy{AllowedFunctions: []FunctionRule{{Catalog: stringPtr("system"), SchemaPath: []string{"main"}, Name: "md5"}}})
	require.ErrorIs(t, err, ErrAccessDenied)
	require.ErrorAs(t, err, &details)
	require.Equal(t, "md5", details.Violations[0].FunctionName)
	// The md5 block covers every identity, so Gatekeeper refuses before catalog resolution and reports none. Blocking
	// only the scalar range leaves its table form eligible, so that refusal happens after resolution and names it.
	require.Empty(t, details.Violations[0].Catalog)
	require.Empty(t, details.Violations[0].SchemaPath)
	require.Empty(t, details.Violations[0].FunctionType)
	_, err = db.ValidateSQL(t.Context(), "SELECT range(3)", ValidationPolicy{BlockedFunctions: []FunctionRule{{Catalog: stringPtr("system"), SchemaPath: []string{"main"}, Name: "range", Type: "scalar"}}})
	require.ErrorIs(t, err, ErrAccessDenied)
	require.ErrorAs(t, err, &details)
	require.Equal(t, "range", details.Violations[0].FunctionName)
	require.Equal(t, "system", details.Violations[0].Catalog)
	require.Equal(t, []string{"main"}, details.Violations[0].SchemaPath)
	require.Equal(t, "scalar", details.Violations[0].FunctionType)
	_, err = db.Query(t.Context(), "SELECT sum(value) FROM shared", &ValidationPolicy{BlockedFunctions: []FunctionRule{{SchemaPath: []string{"main"}, Name: "sum"}}})
	require.ErrorIs(t, err, ErrAccessDenied)
	_, err = db.Query(t.Context(), "SELECT * FROM shared", &ValidationPolicy{BlockedTables: []TableRule{{SchemaPath: []string{"main"}, Table: "shared"}}})
	require.ErrorIs(t, err, ErrAccessDenied)
	result, err = db.ValidateSQL(t.Context(), "SELECT (", ValidationPolicy{})
	require.ErrorAs(t, err, &details)
	require.Equal(t, "parser", result.Details.Code)
	require.NotNil(t, result.Details.Position)
	require.NotEmpty(t, result.Details.Message)
}

func TestValidatedConnectionLifecycle(t *testing.T) {
	db := setupTestDB(t, true, WithMaxConnections(1))
	require.NoError(t, db.Exec(t.Context(), `CREATE SCHEMA tenant;
		CREATE TABLE tenant.items AS SELECT 42 AS value; SET search_path = 'tenant'`))
	allowed := &ValidationPolicy{AllowedTables: []TableRule{{SchemaPath: []string{"tenant"}, Table: "items"}}}
	denied := &ValidationPolicy{AllowedTables: []TableRule{}}
	ctx, cancel := context.WithTimeout(t.Context(), 5*time.Second)
	defer cancel()
	data, err := db.Query(ctx, "SELECT * FROM items", denied)
	require.ErrorIs(t, err, ErrAccessDenied)
	require.Nil(t, data)
	canceled, stop := context.WithCancel(ctx)
	stop()
	data, err = db.Query(canceled, "SELECT * FROM items", allowed)
	require.ErrorIs(t, err, context.Canceled)
	require.Nil(t, data)
	var wg sync.WaitGroup
	for range 4 {
		wg.Go(func() {
			if _, err := db.Query(ctx, "SELECT * FROM items", denied); !errors.Is(err, ErrAccessDenied) {
				t.Error(err)
			}
			if _, err := db.Query(ctx, "SELECT * FROM items", allowed); err != nil {
				t.Error(err)
			}
		})
	}
	wg.Wait()
	data, err = db.Query(ctx, "SELECT * FROM items", allowed)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"value": float64(42)}}, arrowRows(t, data))
	validated := setupTestDB(t, true, WithValidation())
	require.ErrorIs(t, validated.Exec(ctx, "SELECT 1"), ErrExecWithValidation)
	_, err = validated.Query(ctx, "CREATE TABLE forbidden(value INTEGER)", nil)
	require.ErrorIs(t, err, ErrUnsupportedStatement)
}

func TestInvalidPolicyAndInvalidSQL(t *testing.T) {
	db := setupTestDB(t, true)
	for _, stmt := range []string{"SELECT 1", "SELECT 2", "-- comment only"} {
		_, err := db.ValidateSQL(t.Context(), stmt, ValidationPolicy{JSON: stringPtr(`{}`)})
		require.ErrorIs(t, err, ErrInvalidPolicy)
	}
	_, err := db.ValidateSQL(t.Context(), "SELECT 2", ValidationPolicy{AllowedFunctions: []FunctionRule{{SchemaPath: []string{"main"}}}})
	require.ErrorIs(t, err, ErrInvalidPolicy)
	_, err = db.ValidateSQL(t.Context(), "-- comment only", ValidationPolicy{})
	var details ErrorDetails
	require.ErrorAs(t, err, &details)
	require.Equal(t, "invalid_input", details.Code)
	require.NotErrorIs(t, err, ErrInvalidPolicy)
}

func boolPtr(value bool) *bool       { return &value }
func stringPtr(value string) *string { return &value }
