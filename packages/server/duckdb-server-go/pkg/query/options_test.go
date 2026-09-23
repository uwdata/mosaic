package query

import (
	"testing"

	"github.com/stretchr/testify/require"
)

// Gatekeeper inherits the global allowlist when a request omits allowed_functions and intersects when it is present,
// even if empty. The CLI relies on the first behavior; embedders narrowing per tenant rely on the second.
func TestValidationPolicyInheritsGlobalFunctions(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, db.Exec(t.Context(), "CALL gatekeeper_configure(allowed_functions := ['pg_sleep'], blocked_functions := ['md5'])"))

	const query = "SELECT pg_sleep(0)"
	require.NoError(t, db.ValidateSQL(t.Context(), query, ValidationPolicy{}))
	require.NoError(t, db.ValidateSQL(t.Context(), query, ValidationPolicy{BlockedFunctions: []string{"lower"}}))
	require.NoError(t, db.ValidateSQL(t.Context(), query, ValidationPolicy{AllowedTables: []TableRule{}}))

	for _, policy := range []ValidationPolicy{
		{AllowedFunctions: []string{}},
		{AllowedFunctions: []string{"lower"}},
		{UseDefaultFunctions: boolPtr(false), AllowedFunctions: []string{"lower"}},
	} {
		require.Equal(t, "pg_sleep", requireViolation(t, db.ValidateSQL(t.Context(), query, policy), "function").FunctionName)
	}
	require.NoError(t, db.ValidateSQL(t.Context(), query, ValidationPolicy{AllowedFunctions: []string{"pg_sleep"}}))

	for _, policy := range []ValidationPolicy{{}, {BlockedFunctions: []string{}}, {AllowedFunctions: []string{"md5"}}} {
		require.Equal(t, "md5", requireViolation(t, db.ValidateSQL(t.Context(), "SELECT md5('x')", policy), "function").FunctionName)
	}
}
