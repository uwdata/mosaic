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
			db := setupValidationDB(t)
			err := db.ValidateSQL(t.Context(), tt.sql, ValidationPolicy{AllowedSchemas: append([]string{}, tt.allowedSchemas...), BlockedFunctions: tt.functionBlocklist})
			if tt.wantErr {
				assert.Error(t, err, "expected error for SQL: %s", tt.sql)
			} else {
				assert.NoError(t, err, "unexpected error for SQL: %s", tt.sql)
			}
		})
	}
}

func TestDB_ValidateSQLIgnoresShadowingSerializerMacro(t *testing.T) {
	db := setupValidationDB(t)
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
		ValidationPolicy{AllowedSchemas: []string{"tenant_a"}},
	)
	require.ErrorIs(t, err, ErrAccessDenied)
	require.Equal(t, "tenant_b", requireViolation(t, err, "schema").Schema)
}

func TestBaseTableValidatorErrors(t *testing.T) {
	db := setupValidationDB(t)

	t.Run("disallowed schema", func(t *testing.T) {
		err := db.ValidateSQL(t.Context(), "SELECT * FROM tenant_b.secret", ValidationPolicy{AllowedSchemas: []string{"tenant_a"}})
		assert.ErrorIs(t, err, ErrAccessDenied)
		assert.Equal(t, "tenant_b", requireViolation(t, err, "schema").Schema)
	})

	t.Run("unqualified table", func(t *testing.T) {
		err := db.ValidateSQL(t.Context(), "SELECT * FROM secret", ValidationPolicy{AllowedSchemas: []string{"tenant_a"}})
		assert.ErrorIs(t, err, ErrAccessDenied)
		assert.Equal(t, "main", requireViolation(t, err, "schema").Schema)
	})
}

func TestBaseTableValidatorShowStatements(t *testing.T) {
	db := setupValidationDB(t)

	tests := []struct {
		name    string
		sql     string
		wantErr string
	}{
		{
			name:    "disallowed schema",
			sql:     "SHOW TABLES FROM tenant_b",
			wantErr: "schema",
		},
		{
			name:    "allowed schema",
			sql:     "SHOW TABLES FROM tenant_a",
			wantErr: "catalog",
		},
		{
			name:    "all schemas",
			sql:     "SHOW ALL TABLES",
			wantErr: "schema",
		},
		{
			name:    "describe disallowed table",
			sql:     "DESCRIBE tenant_b.secret",
			wantErr: "schema",
		},
		{
			name: "describe expression",
			sql:  "DESCRIBE SELECT 1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := db.ValidateSQL(t.Context(), tt.sql, ValidationPolicy{AllowedSchemas: []string{"tenant_a"}})
			if tt.wantErr == "" {
				assert.NoError(t, err)
				return
			}
			assert.ErrorIs(t, err, ErrAccessDenied)
			requireViolation(t, err, tt.wantErr)
		})
	}
}

func TestBaseTableValidatorRejectsCatalogReferences(t *testing.T) {
	db := setupValidationDB(t)

	tests := []string{
		"SELECT * FROM otherdb.tenant_a.secret",
		"SHOW TABLES FROM otherdb.tenant_a",
		"DESCRIBE otherdb.tenant_a.secret",
		"SELECT * FROM otherdb.tenant_a.fn()",
		"SELECT otherdb.tenant_a.fn() OVER ()",
	}

	for _, sql := range tests {
		t.Run(sql, func(t *testing.T) {
			err := db.ValidateSQL(t.Context(), sql, ValidationPolicy{AllowedSchemas: []string{"tenant_a"}})
			assert.ErrorIs(t, err, ErrAccessDenied)
			assert.Equal(t, "otherdb", requireViolation(t, err, "catalog").Catalog)
		})
	}
}

func TestFunctionBlocklistValidatorNormalizesFunctionNames(t *testing.T) {
	db := setupTestDB(t)
	err := db.ValidateSQL(t.Context(), "SELECT MD5('x'), LOWER('x')", ValidationPolicy{BlockedFunctions: []string{"md5"}})
	require.Equal(t, "md5", requireViolation(t, err, "function").FunctionName)
}

func TestFunctionBlocklistValidatorRejectsMissingFunctionName(t *testing.T) {
	db := setupTestDB(t)
	err := db.ValidateSQL(t.Context(), "SELECT (", ValidationPolicy{BlockedFunctions: []string{"md5"}})
	var details ErrorDetails
	require.ErrorAs(t, err, &details)
	require.Equal(t, "parser", details.Code)
}

func TestFunctionListValidatorCountsViolations(t *testing.T) {
	tests := []struct {
		name      string
		allowlist bool
		functions []string
		want      []string
	}{
		{
			name:      "allowlist",
			allowlist: true,
			functions: []string{"sum"},
			want: []string{
				"function is not allowed: lower",
				"function is not allowed: md5 (2 occurrences)",
			},
		},
		{
			name:      "blocklist",
			functions: []string{"lower", "md5"},
			want: []string{
				"function is not allowed: lower",
				"function is not allowed: md5 (2 occurrences)",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)
			policy := ValidationPolicy{BlockedFunctions: tt.functions}
			if tt.allowlist {
				policy = ValidationPolicy{FunctionAllowlist: &FunctionAllowlistOptions{DisableDefaults: true, Include: tt.functions}}
			}
			for range 2 {
				err := db.ValidateSQL(t.Context(), "SELECT MD5('x'), md5('y'), LOWER('X'), SUM(1) OVER ()", policy)
				var details ErrorDetails
				require.ErrorAs(t, err, &details)
				require.Len(t, details.Violations, len(tt.want))
				for i, want := range tt.want {
					assert.ErrorIs(t, err, ErrAccessDenied)
					assert.Equal(t, want, details.Violations[i].Message)
				}
			}
		})
	}
}

func TestFunctionAllowlistValidator(t *testing.T) {
	tests := []struct {
		name      string
		allowlist []string
		sql       string
		wantErr   string
	}{
		{
			name:      "allows case-insensitive exact name",
			allowlist: []string{"md5"},
			sql:       "SELECT MD5('x')",
		},
		{
			name:      "allows operator",
			allowlist: []string{"+"},
			sql:       "SELECT 1 + 2",
		},
		{
			name:      "rejects name not listed",
			allowlist: []string{"md"},
			sql:       "SELECT MD5('x')",
			wantErr:   "function is not allowed: md5",
		},
		{
			name:      "matches qualified allowed name by leaf name",
			allowlist: []string{"md5"},
			sql:       "SELECT system.main.MD5('x')",
		},
		{
			name:      "rejects qualified name by unlisted leaf name",
			allowlist: []string{"md5"},
			sql:       "SELECT main.LOWER('x')",
			wantErr:   "function is not allowed: lower",
		},
		{
			name:      "allows parser-generated qualified helper",
			allowlist: []string{"list_value"},
			sql:       "SELECT [1, 2]",
		},
		{
			name:      "rejects missing function name",
			allowlist: []string{"md5"},
			sql:       "SELECT (",
			wantErr:   "parser",
		},
		{
			name:      "rejects invalid function name",
			allowlist: []string{"md5"},
			sql:       "SELECT 42() OVER ()",
			wantErr:   "parser",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)
			err := db.ValidateSQL(t.Context(), tt.sql, ValidationPolicy{FunctionAllowlist: &FunctionAllowlistOptions{Include: tt.allowlist, DisableDefaults: true}})
			if tt.wantErr == "" {
				assert.NoError(t, err)
				return
			}
			assert.ErrorContains(t, err, tt.wantErr)
		})
	}
}

func setupValidationDB(t *testing.T) *DB {
	t.Helper()
	db := setupTestDB(t)
	for _, schema := range []string{"schema1", "schema2"} {
		require.NoError(t, db.Exec(t.Context(), "CREATE SCHEMA "+schema))
		for _, table := range []string{"tbl1", "tbl2", "tbl3", "tree"} {
			require.NoError(t, db.Exec(t.Context(), "CREATE TABLE "+schema+"."+table+" (id INTEGER, parent_id INTEGER, a INTEGER, b INTEGER, c INTEGER, d INTEGER)"))
		}
	}
	require.NoError(t, db.Exec(t.Context(), `CREATE SCHEMA tenant_a; CREATE SCHEMA tenant_b;
		CREATE TABLE tenant_a.secret (value INTEGER); CREATE TABLE tenant_b.secret (value INTEGER);
		CREATE TABLE secret (value INTEGER); CREATE TABLE tbl1 (a INTEGER);`))
	return db
}

func requireViolation(t *testing.T, err error, rule string) Violation {
	t.Helper()
	require.ErrorIs(t, err, ErrAccessDenied)
	var details ErrorDetails
	require.ErrorAs(t, err, &details)
	for _, v := range details.Violations {
		if v.Rule == rule {
			return v
		}
	}
	t.Fatalf("missing %s violation: %+v", rule, details)
	return Violation{}
}
