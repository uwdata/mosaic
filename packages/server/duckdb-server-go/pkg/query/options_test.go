package query

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNormalizeFunctionNames(t *testing.T) {
	functions := []string{" MD5 ", "", " + ", "md5", " + "}
	assert.Equal(t, []string{"md5", "+"}, NormalizeFunctionNames(functions))
	assert.Equal(t, []string{" MD5 ", "", " + ", "md5", " + "}, functions)
	assert.Empty(t, NormalizeFunctionNames(nil))
}

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
		{DisableDefaultFunctions: true, AllowedFunctions: []string{"lower"}},
	} {
		require.Equal(t, "pg_sleep", requireViolation(t, db.ValidateSQL(t.Context(), query, policy), "function").FunctionName)
	}
	require.NoError(t, db.ValidateSQL(t.Context(), query, ValidationPolicy{AllowedFunctions: []string{"pg_sleep"}}))

	for _, policy := range []ValidationPolicy{{}, {BlockedFunctions: []string{}}, {AllowedFunctions: []string{"md5"}}} {
		require.Equal(t, "md5", requireViolation(t, db.ValidateSQL(t.Context(), "SELECT md5('x')", policy), "function").FunctionName)
	}
}
