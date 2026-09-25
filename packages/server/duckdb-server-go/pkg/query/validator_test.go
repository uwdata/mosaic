package query

import (
	"context"
	"database/sql/driver"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestPolicyDocument(t *testing.T) {
	for _, tc := range []struct {
		policy ValidationPolicy
		want   string
	}{
		{ValidationPolicy{}, `{"version":1,"options":{}}`},
		{ValidationPolicy{AllowedTables: []TableRule{}}, `{"version":1,"options":{"allowed_tables":[]}}`},
		{ValidationPolicy{AllowedFunctions: []string{}, BlockedFunctions: []string{}, UseDefaultFunctions: boolPtr(false)}, `{"version":1,"options":{"allowed_functions":[],"blocked_functions":[],"use_default_functions":false}}`},
		{ValidationPolicy{AllowedTables: []TableRule{{Schema: "a", Table: "*"}}}, `{"version":1,"options":{"allowed_tables":[{"schema":"a","table":"*"}]}}`},
		{ValidationPolicy{BlockedTables: []TableRule{{Catalog: stringPtr(""), Schema: "a", Table: "*"}}, UseDefaultFunctions: boolPtr(true)}, `{"version":1,"options":{"blocked_tables":[{"catalog":"","schema":"a","table":"*"}],"use_default_functions":true}}`},
	} {
		got, err := tc.policy.document()
		require.NoError(t, err)
		require.JSONEq(t, tc.want, got)
	}
	const raw = "  {\"version\":1,\"options\":{\"allowed_tables\":null}}  "
	got, err := (ValidationPolicy{JSON: stringPtr(raw)}).document()
	require.NoError(t, err)
	require.Equal(t, raw, got)
	_, err = (ValidationPolicy{JSON: stringPtr(raw), BlockedTables: []TableRule{}}).document()
	require.ErrorIs(t, err, ErrInvalidPolicy)
}

func TestValidationRequiresGatekeeper(t *testing.T) {
	db, err := New(t.Context(), testConnector(t, false), WithValidation())
	require.ErrorContains(t, err, "JSON policy API (0.3.0+)")
	require.ErrorContains(t, err, "FORCE INSTALL gatekeeper FROM community")
	require.Nil(t, db)
	db = setupTestDB(t, false)
	_, err = db.ValidateSQL(t.Context(), "SELECT 1", ValidationPolicy{})
	require.ErrorIs(t, err, ErrValidation)
	data, err := db.Query(t.Context(), "SELECT 1", &ValidationPolicy{})
	require.ErrorIs(t, err, ErrValidation)
	require.Empty(t, data)
}

func TestGatekeeperCallsIgnoreShadowingMacros(t *testing.T) {
	connector := testConnector(t, true)
	db, err := New(t.Context(), connector)
	require.NoError(t, err)
	t.Cleanup(db.Close)
	require.NoError(t, db.Exec(t.Context(), `
		CREATE MACRO gatekeeper_validate(sql_text, json := '') AS TABLE
		SELECT true AS allowed, 'ok' AS code, '' AS error_type, '' AS error_message,
		       NULL::BIGINT AS position, [] AS violations, [] AS objects, [] AS functions, [] AS caller_objects;
		CREATE MACRO gatekeeper_configure(json := '') AS TABLE SELECT true AS Success;
	`))
	conn, err := connector.Connect(t.Context())
	require.NoError(t, err)
	defer func() { require.NoError(t, conn.Close()) }()
	require.NoError(t, ConfigureGatekeeper(t.Context(), conn.(driver.ExecerContext), `{"version":1,"options":{"blocked_functions":["md5"]}}`))
	_, err = db.ValidateSQL(t.Context(), "SELECT md5('x')", ValidationPolicy{})
	require.ErrorIs(t, err, ErrAccessDenied)
}

func TestValidationPolicyAndResult(t *testing.T) {
	db := setupTestDB(t, true)
	require.NoError(t, db.Exec(t.Context(), `CREATE TABLE items AS SELECT 42 AS value;
		CREATE VIEW shared AS SELECT * FROM items;
		CALL gatekeeper_configure(blocked_functions := ['md5'])`))
	policy := ValidationPolicy{AllowedTables: []TableRule{{Schema: "main", Table: "shared"}}}
	result, err := db.ValidateSQL(t.Context(), "SELECT sum(value) FROM shared", policy)
	require.NoError(t, err)
	require.True(t, result.Allowed)
	require.NotImplements(t, (*error)(nil), result)
	require.Equal(t, "ok", result.Details.Code)
	view := ResolvedObject{Catalog: "memory", Schema: "main", Table: "shared", Type: "view"}
	table := ResolvedObject{Catalog: "memory", Schema: "main", Table: "items", Type: "table"}
	require.Equal(t, []ResolvedObject{view}, result.CallerObjects)
	require.ElementsMatch(t, []ResolvedObject{view, table}, result.Objects)
	require.Contains(t, result.Functions, ResolvedFunction{Catalog: "system", Schema: "main", Name: "sum", Type: "aggregate"})
	policy.AllowedFunctions = []string{"sum"}
	policy.UseDefaultFunctions = boolPtr(false)
	_, err = db.Query(t.Context(), "SELECT sum(value) FROM shared", &policy)
	require.NoError(t, err)
	_, err = db.Query(t.Context(), "SELECT lower('x') FROM shared", &policy)
	require.ErrorIs(t, err, ErrAccessDenied)

	data, err := db.Query(t.Context(), "SELECT * FROM shared", &ValidationPolicy{JSON: stringPtr(`{"version":1,"options":{"allowed_tables":[{"schema":"main","table":"shared"}]}}`)})
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
	require.Equal(t, table.Schema, details.Violations[0].Schema)
	require.Equal(t, table.Table, details.Violations[0].Table)
	_, err = db.Query(t.Context(), "SELECT md5('x')", &ValidationPolicy{AllowedFunctions: []string{"md5"}})
	require.ErrorIs(t, err, ErrAccessDenied)
	require.ErrorAs(t, err, &details)
	require.Equal(t, "md5", details.Violations[0].FunctionName)
	_, err = db.Query(t.Context(), "SELECT sum(value) FROM shared", &ValidationPolicy{BlockedFunctions: []string{"sum"}})
	require.ErrorIs(t, err, ErrAccessDenied)
	_, err = db.Query(t.Context(), "SELECT * FROM shared", &ValidationPolicy{BlockedTables: []TableRule{{Schema: "main", Table: "shared"}}})
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
	allowed := &ValidationPolicy{AllowedTables: []TableRule{{Schema: "tenant", Table: "items"}}}
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
	_, err := db.ValidateSQL(t.Context(), "SELECT 2", ValidationPolicy{AllowedFunctions: []string{""}})
	require.ErrorIs(t, err, ErrInvalidPolicy)
	_, err = db.ValidateSQL(t.Context(), "-- comment only", ValidationPolicy{})
	var details ErrorDetails
	require.ErrorAs(t, err, &details)
	require.Equal(t, "invalid_input", details.Code)
	require.NotErrorIs(t, err, ErrInvalidPolicy)
}

func boolPtr(value bool) *bool       { return &value }
func stringPtr(value string) *string { return &value }
