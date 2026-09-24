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
	for _, policy := range []ValidationPolicy{{}, {BlockedFunctions: []string{"lower"}}, {AllowedTables: []TableRule{}}} {
		_, err := db.ValidateSQL(t.Context(), query, policy)
		require.NoError(t, err)
	}

	for _, policy := range []ValidationPolicy{
		{AllowedFunctions: []string{}},
		{AllowedFunctions: []string{"lower"}},
		{UseDefaultFunctions: boolPtr(false), AllowedFunctions: []string{"lower"}},
	} {
		_, err := db.ValidateSQL(t.Context(), query, policy)
		require.Equal(t, "pg_sleep", requireViolation(t, err, "function").FunctionName)
	}
	_, err := db.ValidateSQL(t.Context(), query, ValidationPolicy{AllowedFunctions: []string{"pg_sleep"}})
	require.NoError(t, err)

	for _, policy := range []ValidationPolicy{{}, {BlockedFunctions: []string{}}, {AllowedFunctions: []string{"md5"}}} {
		_, err := db.ValidateSQL(t.Context(), "SELECT md5('x')", policy)
		require.Equal(t, "md5", requireViolation(t, err, "function").FunctionName)
	}
}
