package query

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func validateAST(t *testing.T, db *DB, ast string, policy ValidationPolicy) error {
	t.Helper()
	require.Contains(t, validationSQL, serializeCall)
	statement := strings.Replace(validationSQL, serializeCall, "(SELECT (@@request@@()->>'query')::JSON)", 1)
	return db.validateSQL(t.Context(), statement, ast, policy)
}

func TestErrorDetails(t *testing.T) {
	t.Run("all fields", func(t *testing.T) {
		err := ErrorDetails{Type: "parser", Subtype: "syntax", Position: "line 1", Message: "invalid SQL"}
		assert.EqualError(t, err, "query: parser (syntax) at line 1: invalid SQL")
		assert.NotErrorIs(t, err, ErrUnsupportedStatement)
	})

	t.Run("sparse unsupported statement", func(t *testing.T) {
		err := ErrorDetails{Type: "not implemented", Message: "Only SELECT statements can be serialized to json!"}
		assert.EqualError(t, err, "query: not implemented: Only SELECT statements can be serialized to json!")
		assert.ErrorIs(t, err, ErrUnsupportedStatement)
	})
}

func TestDB_ValidateSQL(t *testing.T) {
	tests := []struct {
		name              string
		sql               string
		allowedSchemas    []string
		functionBlocklist []string
		wantErr           bool
	}{
		{
			"zero schema validation",
			"SELECT 1 + 2",
			nil,
			nil,
			false,
		},
		{
			"error on empty schema",
			"SELECT a FROM tbl1",
			nil,
			nil,
			true,
		},
		{
			"error with specified schema and no allowed schemas",
			"SELECT a FROM schema1.tbl1",
			nil,
			nil,
			true,
		},
		{
			"no error on specified schema with matching allowed schema",
			"SELECT a FROM schema1.tbl1",
			[]string{"schema1"},
			nil,
			false,
		},
		{
			"error on specified schema without matching allowed schema",
			"SELECT a FROM schema2.tbl1",
			[]string{"schema1"},
			nil,
			true,
		},
		{
			"subquery in FROM clause with allowed schema",
			"SELECT t.x FROM (SELECT a AS x FROM schema1.tbl1) AS t",
			[]string{"schema1"},
			nil,
			false,
		},
		{
			"subquery in FROM clause with disallowed schema",
			"SELECT t.x FROM (SELECT a AS x FROM schema2.tbl1) AS t",
			[]string{"schema1"},
			nil,
			true,
		},
		{
			"subquery in WHERE clause with allowed schema",
			"SELECT a FROM tbl1 WHERE a IN (SELECT b FROM schema1.tbl2)",
			[]string{"schema1"},
			nil,
			true,
		},
		{
			"subquery in WHERE clause with allowed schemas for both tables",
			"SELECT a FROM schema1.tbl1 WHERE a IN (SELECT b FROM schema1.tbl2)",
			[]string{"schema1"},
			nil,
			false,
		},
		{
			"CTE with allowed schema",
			"WITH cte AS (SELECT a FROM schema1.tbl1) SELECT * FROM cte",
			[]string{"schema1"},
			nil,
			false,
		},
		{
			"CTE with disallowed schema",
			"WITH cte AS (SELECT a FROM schema2.tbl1) SELECT * FROM cte",
			[]string{"schema1"},
			nil,
			true,
		},
		{
			"complex nested subqueries with allowed schemas",
			`SELECT * FROM schema1.tbl1 t1
			 WHERE t1.a IN (
				 SELECT t2.b FROM schema1.tbl2 t2
				 WHERE t2.c > (SELECT AVG(t3.d) FROM schema1.tbl3 t3)
			 )`,
			[]string{"schema1"},
			nil,
			false,
		},
		{
			"complex nested subqueries with disallowed schema",
			`SELECT * FROM schema1.tbl1 t1
			 WHERE t1.a IN (
				 SELECT t2.b FROM schema2.tbl2 t2
				 WHERE t2.c > (SELECT AVG(t3.d) FROM schema1.tbl3 t3)
			 )`,
			[]string{"schema1"},
			nil,
			true,
		},
		{
			"join between schemas with all schemas allowed",
			"SELECT t1.a, t2.b FROM schema1.tbl1 t1 JOIN schema2.tbl2 t2 ON t1.id = t2.id",
			[]string{"schema1", "schema2"},
			nil,
			false,
		},
		{
			"join between schemas with one schema not allowed",
			"SELECT t1.a, t2.b FROM schema1.tbl1 t1 JOIN schema2.tbl2 t2 ON t1.id = t2.id",
			[]string{"schema1"},
			nil,
			true,
		},
		{
			"union with allowed schemas",
			"SELECT a FROM schema1.tbl1 UNION SELECT b FROM schema1.tbl2",
			[]string{"schema1"},
			nil,
			false,
		},
		{
			"union with one disallowed schema",
			"SELECT a FROM schema1.tbl1 UNION SELECT b FROM schema2.tbl2",
			[]string{"schema1"},
			nil,
			true,
		},
		{
			"window function with allowed schema",
			"SELECT a, ROW_NUMBER() OVER (PARTITION BY b ORDER BY c) FROM schema1.tbl1",
			[]string{"schema1"},
			nil,
			false,
		},
		{
			"window function with subquery and allowed schema",
			`SELECT t.a, t.rn 
			 FROM (
				 SELECT a, ROW_NUMBER() OVER (PARTITION BY b ORDER BY c) AS rn 
				 FROM schema1.tbl1
			 ) t
			 WHERE t.rn <= 10`,
			[]string{"schema1"},
			nil,
			false,
		},
		{
			"recursive CTE with allowed schema",
			`WITH RECURSIVE cte AS (
				 SELECT id, parent_id FROM schema1.tree WHERE id = 1
				 UNION ALL
				 SELECT t.id, t.parent_id FROM schema1.tree t JOIN cte c ON t.parent_id = c.id
			 )
			 SELECT * FROM cte`,
			[]string{"schema1"},
			nil,
			false,
		},
		{
			"recursive CTE with disallowed schema",
			`WITH RECURSIVE cte AS (
				 SELECT id, parent_id FROM schema2.tree WHERE id = 1
				 UNION ALL
				 SELECT t.id, t.parent_id FROM schema2.tree t JOIN cte c ON t.parent_id = c.id
			 )
			 SELECT * FROM cte`,
			[]string{"schema1"},
			nil,
			true,
		},
		{
			"disallowed iceberg_metadata function",
			`SELECT * FROM iceberg_metadata(iceberg_table)`,
			nil,
			[]string{"iceberg_metadata"},
			true,
		},
		{
			"disallowed bigquery_query function",
			`SELECT * FROM bigquery_query('SELECT * FROM project.dataset.table')`,
			nil,
			[]string{"bigquery_query"},
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)

			err := db.ValidateSQL(t.Context(), tt.sql, ValidationPolicy{
				CheckSchemas: true, AllowedSchemas: tt.allowedSchemas, BlockedFunctions: tt.functionBlocklist,
			})
			if tt.wantErr {
				assert.Error(t, err, "expected error for SQL: %s", tt.sql)
			} else {
				assert.NoError(t, err, "unexpected error for SQL: %s", tt.sql)
			}
		})
	}
}

func TestDB_ValidateSQLIgnoresShadowingSerializerMacro(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, db.Exec(t.Context(), `
		CREATE MACRO json_serialize_sql(
			sql_text,
			skip_default := true,
			skip_empty := true,
			skip_null := true
		) AS {'error': false, 'statements': []}
	`))

	err := db.ValidateSQL(
		t.Context(),
		"SELECT * FROM tenant_b.secret",
		ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}},
	)
	require.ErrorIs(t, err, ErrAccessDenied)
	require.EqualError(t, err, "query: access denied: unauthorized access to schema 'tenant_b'")
}

func TestBaseTableValidatorErrors(t *testing.T) {
	db := setupTestDB(t)

	t.Run("disallowed schema", func(t *testing.T) {
		err := db.ValidateSQL(t.Context(), "SELECT * FROM tenant_b.secret", ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}})
		assert.ErrorIs(t, err, ErrAccessDenied)
		assert.EqualError(t, err, "query: access denied: unauthorized access to schema 'tenant_b'")
	})

	t.Run("unqualified table", func(t *testing.T) {
		err := db.ValidateSQL(t.Context(), "SELECT * FROM secret", ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}})
		assert.ErrorIs(t, err, ErrAccessDenied)
		assert.EqualError(t, err, "query: access denied: unauthorized access to table 'secret' with empty schema")
	})
}

func TestBaseTableValidatorShowStatements(t *testing.T) {
	db := setupTestDB(t)

	tests := []struct {
		name    string
		sql     string
		wantErr string
	}{
		{
			name:    "disallowed schema",
			sql:     "SHOW TABLES FROM tenant_b",
			wantErr: "query: access denied: unauthorized access to schema 'tenant_b'",
		},
		{
			name: "allowed schema",
			sql:  "SHOW TABLES FROM tenant_a",
		},
		{
			name:    "all schemas",
			sql:     "SHOW ALL TABLES",
			wantErr: "query: access denied: SHOW statement requires an explicit authorized schema",
		},
		{
			name:    "describe disallowed table",
			sql:     "DESCRIBE tenant_b.secret",
			wantErr: "query: access denied: unauthorized access to schema 'tenant_b'",
		},
		{
			name: "describe expression",
			sql:  "DESCRIBE SELECT 1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := db.ValidateSQL(t.Context(), tt.sql, ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}})
			if tt.wantErr == "" {
				assert.NoError(t, err)
				return
			}
			assert.ErrorIs(t, err, ErrAccessDenied)
			assert.EqualError(t, err, tt.wantErr)
		})
	}
}

func TestBaseTableValidatorRejectsCatalogReferences(t *testing.T) {
	db := setupTestDB(t)

	tests := []string{
		"SELECT * FROM otherdb.tenant_a.secret",
		"SHOW TABLES FROM otherdb.tenant_a",
		"DESCRIBE otherdb.tenant_a.secret",
		"SELECT * FROM otherdb.tenant_a.fn()",
		"SELECT otherdb.tenant_a.fn() OVER ()",
	}

	for _, sql := range tests {
		t.Run(sql, func(t *testing.T) {
			err := db.ValidateSQL(t.Context(), sql, ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}})
			assert.ErrorIs(t, err, ErrAccessDenied)
			assert.EqualError(t, err, "query: access denied: access to catalog 'otherdb' is not allowed")
		})
	}
}

func TestFunctionBlocklistValidatorNormalizesFunctionNames(t *testing.T) {
	db := setupTestDB(t)
	err := db.ValidateSQL(t.Context(), "SELECT MD5('x'), LOWER('x')", ValidationPolicy{BlockedFunctions: []string{"md5"}})
	assert.ErrorIs(t, err, ErrAccessDenied)
	assert.EqualError(t, err, "query: access denied: use of function 'md5' is not allowed")
}

func TestFunctionBlocklistValidatorRejectsMissingFunctionName(t *testing.T) {
	db := setupTestDB(t)
	err := validateAST(t, db, `{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[{"class":"FUNCTION","type":"FUNCTION"}],"from_table":{"type":"EMPTY"}}}]}`, ValidationPolicy{BlockedFunctions: []string{"md5"}})
	require.ErrorIs(t, err, ErrUnsupportedStatement)
}

func TestFunctionListValidatorCountsViolations(t *testing.T) {
	tests := []struct {
		name   string
		policy ValidationPolicy
		want   []string
	}{
		{
			name:   "allowlist",
			policy: ValidationPolicy{CheckFunctions: true, AllowedFunctions: []string{"sum"}},
			want: []string{
				"query: access denied: function 'lower' is not in the allowlist",
				"query: access denied: function 'md5' is not in the allowlist (2 occurrences)",
			},
		},
		{
			name:   "blocklist",
			policy: ValidationPolicy{BlockedFunctions: []string{"lower", "md5"}},
			want: []string{
				"query: access denied: use of function 'lower' is not allowed",
				"query: access denied: use of function 'md5' is not allowed (2 occurrences)",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)
			for range 2 {
				err := db.ValidateSQL(t.Context(), "SELECT MD5('x'), md5('x') OVER (), LOWER('x'), SUM(1)", tt.policy)
				require.ErrorIs(t, err, ErrAccessDenied)
				assert.EqualError(t, err, strings.Join(tt.want, "\n"))
			}
		})
	}
}

func TestFunctionAllowlistValidator(t *testing.T) {
	tests := []struct {
		name      string
		allowlist []string
		node      map[string]any
		wantErr   string
	}{
		{
			name:      "allows case-insensitive exact name",
			allowlist: []string{"md5"},
			node:      map[string]any{"class": "FUNCTION", "function_name": "MD5"},
		},
		{
			name:      "allows operator",
			allowlist: []string{"+"},
			node:      map[string]any{"class": "FUNCTION", "function_name": "+"},
		},
		{
			name:      "rejects name not listed",
			allowlist: []string{"md"},
			node:      map[string]any{"class": "FUNCTION", "function_name": "MD5"},
			wantErr:   "query: access denied: function 'md5' is not in the allowlist",
		},
		{
			name:      "matches qualified allowed name by leaf name",
			allowlist: []string{"md5"},
			node: map[string]any{
				"class":         "WINDOW",
				"catalog":       "OtherDB",
				"schema":        "Tenant",
				"function_name": "MD5",
			},
		},
		{
			name:      "rejects qualified name by unlisted leaf name",
			allowlist: []string{"md5"},
			node: map[string]any{
				"class":         "FUNCTION",
				"schema":        "Tenant",
				"function_name": "LOWER",
			},
			wantErr: "query: access denied: function 'lower' is not in the allowlist",
		},
		{
			name:      "allows parser-generated qualified helper",
			allowlist: []string{"list_value"},
			node: map[string]any{
				"class":         "FUNCTION",
				"schema":        "main",
				"function_name": "list_value",
			},
		},
		{
			name:      "rejects missing function name",
			allowlist: []string{"md5"},
			node:      map[string]any{"class": "FUNCTION"},
			wantErr:   "unsupported SQL AST",
		},
		{
			name:      "rejects invalid function name",
			allowlist: []string{"md5"},
			node:      map[string]any{"class": "WINDOW", "function_name": 42},
			wantErr:   "unsupported SQL AST",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)
			tt.node["type"] = "FUNCTION"
			if tt.node["class"] == "WINDOW" {
				tt.node["type"] = "WINDOW_AGGREGATE"
			}
			ast, err := json.Marshal(map[string]any{"error": false, "statements": []any{map[string]any{
				"node": map[string]any{"type": "SELECT_NODE", "select_list": []any{tt.node}, "from_table": map[string]any{"type": "EMPTY"}},
			}}})
			require.NoError(t, err)
			err = validateAST(t, db, string(ast), ValidationPolicy{CheckFunctions: true, AllowedFunctions: tt.allowlist})
			if tt.wantErr == "" {
				assert.NoError(t, err)
				return
			}
			assert.ErrorContains(t, err, tt.wantErr)
		})
	}
}
