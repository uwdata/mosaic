package query

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

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

			var validators []Validator

			// the tests are constructed to always include the base table validator, and fail if it isn't applied,
			// due to how nil and empty slices are treated
			validators = append(validators, newBaseTableValidator(tt.allowedSchemas))

			if len(tt.functionBlocklist) > 0 {
				validators = append(validators, newFunctionBlocklistValidator(tt.functionBlocklist))
			}

			err := db.ValidateSQL(t.Context(), tt.sql, validators...)
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
		newBaseTableValidator([]string{"tenant_a"}),
	)
	require.ErrorIs(t, err, ErrAccessDenied)
	require.EqualError(t, err, "query: access denied: unauthorized access to schema 'tenant_b'")
}

func TestBaseTableValidatorErrors(t *testing.T) {
	db := setupTestDB(t)

	t.Run("disallowed schema", func(t *testing.T) {
		err := db.ValidateSQL(t.Context(), "SELECT * FROM tenant_b.secret", newBaseTableValidator([]string{"tenant_a"}))
		assert.ErrorIs(t, err, ErrAccessDenied)
		assert.EqualError(t, err, "query: access denied: unauthorized access to schema 'tenant_b'")
	})

	t.Run("unqualified table", func(t *testing.T) {
		err := db.ValidateSQL(t.Context(), "SELECT * FROM secret", newBaseTableValidator([]string{"tenant_a"}))
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
			err := db.ValidateSQL(t.Context(), tt.sql, newBaseTableValidator([]string{"tenant_a"}))
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
			err := db.ValidateSQL(t.Context(), sql, newBaseTableValidator([]string{"tenant_a"}))
			assert.ErrorIs(t, err, ErrAccessDenied)
			assert.EqualError(t, err, "query: access denied: access to catalog 'otherdb' is not allowed")
		})
	}
}

func TestFunctionBlocklistValidatorNormalizesFunctionNames(t *testing.T) {
	validator := newFunctionBlocklistValidator([]string{"md5"})
	validator.CheckNode(map[string]any{
		"class":         "FUNCTION",
		"function_name": "MD5",
	}, nil)
	validator.CheckNode(map[string]any{
		"class":         "FUNCTION",
		"function_name": "LOWER",
	}, nil)

	errs := validator.Validate()
	if assert.Len(t, errs, 1) {
		assert.ErrorIs(t, errs[0], ErrAccessDenied)
		assert.EqualError(t, errs[0], "query: access denied: use of function 'md5' is not allowed")
	}
}

func TestFunctionBlocklistValidatorRejectsMissingFunctionName(t *testing.T) {
	validator := newFunctionBlocklistValidator([]string{"md5"})
	validator.CheckNode(map[string]any{"class": "FUNCTION"}, nil)

	errs := validator.Validate()
	require.Len(t, errs, 1)
	assert.EqualError(t, errs[0], "query: invalid function node: missing 'function_name'")
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
			wantErr:   "query: invalid function node: missing 'function_name'",
		},
		{
			name:      "rejects invalid function name",
			allowlist: []string{"md5"},
			node:      map[string]any{"class": "WINDOW", "function_name": 42},
			wantErr:   "query: invalid 'function_name' in function, expected string: 42",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			validator := newFunctionAllowlistValidator(tt.allowlist)
			validator.CheckNode(tt.node, nil)

			errs := validator.Validate()
			if tt.wantErr == "" {
				assert.Empty(t, errs)
				return
			}
			if assert.Len(t, errs, 1) {
				assert.EqualError(t, errs[0], tt.wantErr)
			}
		})
	}
}
