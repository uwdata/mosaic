package query

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidationCTEScope(t *testing.T) {
	db := setupTestDB(t)
	policy := ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}}
	for _, tt := range []struct {
		name, sql string
		allowed   bool
	}{
		{"nested declaration", "SELECT * FROM secret WHERE EXISTS (WITH secret AS (SELECT 1) SELECT * FROM secret)", false},
		{"different statement", "WITH secret AS (SELECT 1) SELECT * FROM secret; SELECT * FROM secret", false},
		{"different statement reversed", "SELECT * FROM secret; WITH secret AS (SELECT 1) SELECT * FROM secret", false},
		{"self reference", "WITH secret AS (SELECT * FROM secret) SELECT * FROM secret", false},
		{"forward reference", "WITH a AS (SELECT * FROM b), b AS (SELECT 1) SELECT * FROM a", false},
		{"previous sibling", "WITH z AS (SELECT 1), a AS (SELECT * FROM z) SELECT * FROM a", true},
		{"outer reference", "WITH a AS (SELECT 1) SELECT * FROM (WITH b AS (SELECT * FROM a) SELECT * FROM b)", true},
		{"shadowed outer reference", "WITH t AS (SELECT 1) SELECT * FROM (WITH t AS (SELECT * FROM t) SELECT * FROM t)", true},
		{"case insensitive", "WITH Cte AS (SELECT 1) SELECT * FROM CTE", true},
		{"quoted name", `WITH "a.[0]'" AS (SELECT 1) SELECT * FROM "a.[0]'"`, true},
		{"recursive seed self reference", "WITH RECURSIVE cte AS (SELECT * FROM cte UNION ALL SELECT 1 WHERE false) SELECT * FROM cte", false},
		{"recursive term", "WITH RECURSIVE cte AS (SELECT 1 AS n UNION ALL SELECT n+1 FROM cte WHERE n<3) SELECT * FROM cte", true},
		{"recursive sibling", "WITH RECURSIVE cte AS (SELECT 1 AS n UNION ALL SELECT n+1 FROM cte WHERE n<3), b AS (SELECT * FROM cte) SELECT * FROM b", true},
		{"qualified name is table", "WITH secret AS (SELECT 1) SELECT * FROM tenant_b.secret", false},
	} {
		t.Run(tt.name, func(t *testing.T) {
			err := db.ValidateSQL(t.Context(), tt.sql, policy)
			if tt.allowed {
				require.NoError(t, err)
			} else {
				require.ErrorIs(t, err, ErrAccessDenied)
			}
		})
	}

	require.NoError(t, db.Exec(t.Context(), "CREATE TABLE secret AS SELECT 42 AS value"))
	_, err := db.QueryArrow(t.Context(), "SELECT * FROM secret WHERE EXISTS (WITH secret AS (SELECT 1) SELECT * FROM secret)", []string{"tenant_a"})
	require.ErrorIs(t, err, ErrAccessDenied)
}

func TestValidationReadSyntax(t *testing.T) {
	db := setupTestDB(t)
	for _, query := range []string{
		"VALUES (1), (2)",
		"SELECT 1 UNION SELECT 2 INTERSECT SELECT 3",
		"SELECT 1 AS x UNION BY NAME SELECT 2 AS y",
		"SELECT CURRENT_DATE, CURRENT_TIMESTAMP",
		"SUMMARIZE SELECT 1",
		"SELECT * EXCLUDE (x) REPLACE (md5(y) AS y) FROM tenant_a.t",
		"SELECT CASE WHEN x BETWEEN 1 AND 3 THEN x::VARCHAR ELSE NULL END FROM tenant_a.t",
		"SELECT NOT x, x IS NULL, x IN (1,2), coalesce(x,1) FROM tenant_a.t",
		"SELECT list_transform([1,2], lambda x: x+1)",
		"SELECT DISTINCT ON (x) x FROM tenant_a.t ORDER BY x DESC NULLS LAST LIMIT 3 OFFSET 1",
		"SELECT sum(x) FILTER (WHERE x>0) OVER (PARTITION BY y ORDER BY z ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) FROM tenant_a.t",
		"SELECT * FROM tenant_a.t TABLESAMPLE reservoir(10 ROWS)",
		"SELECT * FROM tenant_a.t PIVOT (sum(x) FOR y IN (1,2))",
		"SELECT * FROM tenant_a.t UNPIVOT (value FOR name IN (x,y))",
		"SELECT a FROM tenant_a.t GROUP BY GROUPING SETS ((a), ()) HAVING count(*)>1",
		"SELECT * FROM range(3) WITH ORDINALITY",
		"SELECT 'DROP TABLE t; --' AS text",
		"SELECT '{\"type\":\"DELETE_QUERY_NODE\"}'::JSON",
	} {
		t.Run(query, func(t *testing.T) {
			require.NoError(t, db.ValidateSQL(t.Context(), query, ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}}))
		})
	}
}

func TestValidationRejectsStatements(t *testing.T) {
	db := setupTestDB(t)
	for _, query := range []string{
		"CREATE TABLE tenant_a.t(id INT)", "CREATE TABLE tenant_a.t AS SELECT 1",
		"DROP TABLE tenant_a.t", "ALTER TABLE tenant_a.t ADD COLUMN x INT",
		"CREATE VIEW tenant_a.v AS SELECT 1", "CREATE MACRO f() AS 1",
		"CREATE SCHEMA tenant_a", "TRUNCATE tenant_a.t",
		"INSERT INTO tenant_a.t VALUES (1)", "UPDATE tenant_a.t SET id=2", "DELETE FROM tenant_a.t",
		"MERGE INTO tenant_a.t USING tenant_a.s ON t.id=s.id WHEN MATCHED THEN DELETE",
		"COPY tenant_a.t TO '/tmp/not-executed.csv'", "ATTACH ':memory:' AS otherdb",
		"SELECT 1; DROP TABLE tenant_a.t", "PRAGMA version", "SET threads=1",
	} {
		t.Run(query, func(t *testing.T) {
			require.ErrorIs(t, db.ValidateSQL(t.Context(), query, ValidationPolicy{}), ErrUnsupportedStatement)
		})
	}
}

func TestValidationRejectsUnknownAST(t *testing.T) {
	db := setupTestDB(t)
	for _, ast := range []string{
		`{}`, `{"error":false}`, `{"error":false,"statements":{}}`,
		`{"error":false,"statements":[{}]}`,
		`{"error":false,"statements":[{"type":"DROP_STATEMENT","node":{"type":"SELECT_NODE","select_list":[],"from_table":{"type":"EMPTY"}}}]}`,
		`{"error":false,"statements":[{"node":{"type":"DROP_QUERY_NODE"}}]}`,
		`{"error":false,"statements":[{"node":{"class":"FUNCTION","type":"SELECT_NODE","function_name":"md5"}}]}`,
		`{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[],"from_table":{"class":"FUNCTION","type":"BASE_TABLE","function_name":"md5"}}}]}`,
		`{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[[{"class":"STAR","type":"STAR"}]],"from_table":{"type":"EMPTY"}}}]}`,
		`{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[],"from_table":{"type":"EXPRESSION_LIST","values":[[[{"class":"STAR","type":"STAR"}]]]}}}]}`,
		`{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[],"from_table":{"type":"TABLE_FUNCTION","function":{"type":"BASE_TABLE","table_name":"hidden"}}}}]}`,
		`{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[],"from_table":{"type":"FUTURE_TABLE"}}}]}`,
		`{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[],"from_table":{"type":"SHOW_REF","show_type":"FUTURE_WRITE"}}}]}`,
		`{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[{"class":"FUTURE_EXPRESSION","type":"FUNCTION"}],"from_table":{"type":"EMPTY"}}}]}`,
		`{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[{"class":"OPERATOR","type":"FUTURE_OPERATOR","children":[]}],"from_table":{"type":"EMPTY"}}}]}`,
		`{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[],"from_table":{"type":"EMPTY"},"new_side_effect":{"type":"DELETE_QUERY_NODE"}}}]}`,
		`{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[],"from_table":{"type":"BASE_TABLE","table_name":"t","schema_name":42}}}]}`,
		`{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[],"from_table":{"type":"EMPTY"},"cte_map":{"map":[{"key":"deleted","value":{"query":{"node":{"type":"DELETE_QUERY_NODE"}}}}]}}}]}`,
	} {
		t.Run(ast, func(t *testing.T) {
			require.ErrorIs(t, validateAST(t, db, ast, ValidationPolicy{}), ErrUnsupportedStatement)
		})
	}
}

func TestValidationAlphaFixtures(t *testing.T) {
	db := setupTestDB(t)
	paths, err := filepath.Glob("testdata/ast/v2.0.0-alpha41489/*.json")
	require.NoError(t, err)
	require.NotEmpty(t, paths)
	for _, path := range paths {
		t.Run(filepath.Base(path), func(t *testing.T) {
			ast, err := os.ReadFile(path)
			require.NoError(t, err)
			require.True(t, json.Valid(ast))
			require.ErrorIs(t, validateAST(t, db, string(ast), ValidationPolicy{}), ErrUnsupportedStatement)
		})
	}
}

func TestValidationFlattenedGrammar(t *testing.T) {
	db := setupTestDB(t)
	policy := ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}, BlockedFunctions: []string{"md5"}}
	for _, depth := range []int{0, 1, 20, 100} {
		wrap := func(source string) string {
			return "SELECT * FROM " + strings.Repeat("(SELECT * FROM ", depth) + source + strings.Repeat(") t", depth)
		}
		require.NoError(t, db.ValidateSQL(t.Context(), wrap("tenant_a.orders"), policy))
		require.ErrorIs(t, db.ValidateSQL(t.Context(), wrap("tenant_b.secret"), policy), ErrAccessDenied)
		require.ErrorIs(t, db.ValidateSQL(t.Context(), wrap("(SELECT md5('x')) blocked"), policy), ErrAccessDenied)
	}

	for _, query := range []string{
		"SELECT [{'type': 'BASE_TABLE', 'table_name': 'secret'}, {'class': 'FUNCTION', 'function_name': 'md5'}]",
		"SELECT * FROM (VALUES (1, 2), (3, 4)) t(a,b)",
		"SELECT * REPLACE (upper(x) AS x) FROM tenant_a.t",
	} {
		require.NoError(t, db.ValidateSQL(t.Context(), query, policy))
	}
	for _, query := range []string{
		"SELECT * REPLACE (md5(x) AS x) FROM tenant_a.t",
		"SELECT * FROM (VALUES (md5('x'), 2)) t(a,b)",
		"SELECT CASE WHEN true THEN md5('x') ELSE '' END",
		"SELECT list(x ORDER BY md5(x)) FROM tenant_a.t",
		"SELECT * FROM tenant_a.t PIVOT (sum(x) FOR y IN (1,2)) ORDER BY md5('x')",
	} {
		require.ErrorIs(t, db.ValidateSQL(t.Context(), query, policy), ErrAccessDenied)
	}

	ast := `{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[{"class":"CONSTANT","type":"VALUE_CONSTANT","value":{"type":{"id":"STRUCT"},"value":{"type":"DELETE_QUERY_NODE","class":"FUNCTION","function_name":"md5"}}}],"from_table":{"type":"EMPTY"}}}]}`
	require.NoError(t, validateAST(t, db, ast, policy))
	ast = strings.Replace(ast, `"from_table":{"type":"EMPTY"}`, `"from_table":{"type":"BASE_TABLE","table_name":"secret"}`, 1)
	require.ErrorIs(t, validateAST(t, db, ast, policy), ErrAccessDenied)
}

func TestValidationFunctionPolicy(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, db.ValidateSQL(t.Context(), "SELECT 1", ValidationPolicy{CheckFunctions: true}))
	for _, query := range []string{"SELECT md5('x')", "SELECT sum(x) FROM t", "SELECT row_number() OVER ()", "SELECT * FROM range(3)", "SELECT 1+2"} {
		require.ErrorIs(t, db.ValidateSQL(t.Context(), query, ValidationPolicy{CheckFunctions: true}), ErrAccessDenied)
	}
	err := db.ValidateSQL(t.Context(), "SELECT * FROM tenant_a.t t JOIN tenant_a.s s ON regexp_matches(t.x,s.x)", ValidationPolicy{BlockedFunctions: []string{"regexp_matches"}})
	require.ErrorIs(t, err, ErrAccessDenied)
	assert.Contains(t, err.Error(), "regexp_matches")
	err = db.ValidateSQL(t.Context(), "SELECT 1", ValidationPolicy{CheckFunctions: true, BlockedFunctions: []string{"md5"}})
	require.ErrorContains(t, err, "cannot both be configured")
}

func TestValidationBuiltinShadowing(t *testing.T) {
	db := setupTestDB(t)
	for _, statement := range []string{
		"CREATE MACRO list_contains(xs, x) AS true",
		"CREATE MACRO json_tree(x) AS TABLE SELECT 1 AS id",
		"CREATE MACRO lower(x) AS 'allowed'",
		"CREATE MACRO starts_with(x,y) AS true",
	} {
		require.NoError(t, db.Exec(t.Context(), statement))
	}
	err := db.ValidateSQL(t.Context(), "SELECT md5('x') FROM tenant_b.secret", ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}, BlockedFunctions: []string{"md5"}})
	require.ErrorIs(t, err, ErrAccessDenied)
	assert.True(t, strings.Contains(err.Error(), "tenant_b") && strings.Contains(err.Error(), "md5"))
}
