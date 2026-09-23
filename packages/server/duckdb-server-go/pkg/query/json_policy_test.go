package query

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestPolicyDocumentPreservesPresence(t *testing.T) {
	for _, tc := range []struct {
		policy ValidationPolicy
		want   string
	}{
		{ValidationPolicy{}, `{"version":1,"options":{}}`},
		{ValidationPolicy{AllowedTables: []TableRule{}}, `{"version":1,"options":{"allowed_tables":[]}}`},
		{ValidationPolicy{AllowedFunctions: []string{}, BlockedFunctions: []string{}, UseDefaultFunctions: boolPtr(false)}, `{"version":1,"options":{"allowed_functions":[],"blocked_functions":[],"use_default_functions":false}}`},
		{ValidationPolicy{AllowedTables: []TableRule{{Schema: "a", Table: "*"}}}, `{"version":1,"options":{"allowed_tables":[{"schema":"a","table":"*"}]}}`},
		{ValidationPolicy{AllowedTables: []TableRule{{Catalog: stringPtr(""), Schema: "a", Table: "*"}}}, `{"version":1,"options":{"allowed_tables":[{"catalog":"","schema":"a","table":"*"}]}}`},
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
	require.ErrorContains(t, err, "cannot be combined")
}

func TestGatekeeperJSONPolicy(t *testing.T) {
	db := setupValidationDB(t)
	for _, document := range []string{
		`{"version":1,"options":{}}`,
		`{"version":1,"options":{"allowed_tables":[{"catalog":null,"schema":"tenant_a","table":"secret"}]}}`,
		`{"version":1,"options":{"allowed_tables":[{"schema":"tenant_a","table":"secret"}]}}`,
	} {
		_, err := db.QueryArrow(t.Context(), "SELECT * FROM tenant_a.secret", &ValidationPolicy{JSON: &document})
		require.NoError(t, err)
	}
	_, err := db.QueryArrow(t.Context(), "SELECT * FROM tenant_a.secret", &ValidationPolicy{JSON: stringPtr(`{"version":1,"options":{"allowed_tables":[]}}`)})
	violation := requireViolation(t, err, "table")
	require.Equal(t, "memory", violation.Catalog)
	require.Equal(t, "tenant_a", violation.Schema)
	require.Equal(t, "secret", violation.Table)
	for _, document := range []string{
		``, `null`, `{}`, `{"version":2,"options":{}}`,
		`{"version":1,"version":1,"options":{}}`,
		`{"version":1,"options":{"allowed_tables":null}}`,
		`{"version":1,"options":{"allowed_tables":[{"catalog":"","schema":"tenant_a","table":"*"}]}}`,
		`{"version":1,"options":{"allowed_tables":[{"schema":null,"table":"*"}]}}`,
		`{"version":1,"options":{"allowed_functions":[null]}}`,
		`{"version":1,"options":{"use_default_functions":null}}`,
		`{"version":1,"options":{"unknown":[]}}`,
	} {
		t.Run(document, func(t *testing.T) {
			err := db.ValidateSQL(t.Context(), "SELECT 1", ValidationPolicy{JSON: &document})
			var details ErrorDetails
			require.ErrorAs(t, err, &details)
			require.Equal(t, "invalid_input", details.Code)
			require.ErrorIs(t, err, ErrInvalidPolicy)
		})
	}
}

func TestGatekeeperCallerObjects(t *testing.T) {
	db := setupValidationDB(t)
	require.NoError(t, db.Exec(t.Context(), "CREATE VIEW tenant_a.shared AS SELECT * FROM tenant_b.secret"))
	view := ResolvedObject{Catalog: "memory", Schema: "tenant_a", Table: "shared", Type: "view"}
	table := ResolvedObject{Catalog: "memory", Schema: "tenant_b", Table: "secret", Type: "table"}
	result, err := db.InspectSQL(t.Context(), "SELECT * FROM tenant_a.shared", ValidationPolicy{AllowedTables: []TableRule{{Schema: "tenant_a", Table: "shared"}}})
	require.NoError(t, err)
	require.True(t, result.Allowed)
	require.NotImplements(t, (*error)(nil), result)
	require.Equal(t, "ok", result.Details.Code)
	require.Equal(t, []ResolvedObject{view}, result.CallerObjects)
	require.ElementsMatch(t, []ResolvedObject{view, table}, result.Objects)
	result, err = db.InspectSQL(t.Context(), "SELECT * FROM tenant_a.shared, tenant_b.secret", ValidationPolicy{})
	require.NoError(t, err)
	require.ElementsMatch(t, []ResolvedObject{view, table}, result.CallerObjects)
	result, err = db.InspectSQL(t.Context(), "SELECT * FROM tenant_a.shared, tenant_b.secret", ValidationPolicy{AllowedTables: []TableRule{{Schema: "tenant_a", Table: "shared"}}})
	require.ErrorIs(t, err, ErrAccessDenied)
	require.False(t, result.Allowed)
	require.Empty(t, result.CallerObjects)
	require.Empty(t, result.Objects)
	require.Empty(t, result.Functions)
	violation := requireViolation(t, err, "table")
	require.Equal(t, table.Catalog, violation.Catalog)
	require.Equal(t, table.Schema, violation.Schema)
	require.Equal(t, table.Table, violation.Table)
}

func TestInvalidPolicyAndInvalidSQL(t *testing.T) {
	db := setupTestDB(t)
	for _, stmt := range []string{"", "  ", "-- comment only", "; ;"} {
		err := db.ValidateSQL(t.Context(), stmt, ValidationPolicy{})
		var details ErrorDetails
		require.ErrorAs(t, err, &details)
		require.Equal(t, "invalid_input", details.Code)
		require.NotErrorIs(t, err, ErrInvalidPolicy)
		err = db.ValidateSQL(t.Context(), stmt, ValidationPolicy{JSON: stringPtr(`{}`)})
		require.ErrorIs(t, err, ErrInvalidPolicy)
	}
	err := db.ValidateSQL(t.Context(), "SELECT 2", ValidationPolicy{AllowedFunctions: []string{""}})
	require.ErrorIs(t, err, ErrInvalidPolicy)
}
