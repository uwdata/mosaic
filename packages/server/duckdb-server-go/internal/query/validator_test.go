package query

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestDB_ValidateSQL(t *testing.T) {
	tests := []struct {
		name           string
		sql            string
		allowedSchemas []string
		wantErr        bool
	}{
		{
			"zero schema validation",
			"SELECT 1 + 2",
			nil,
			false,
		},
		{
			"error on empty schema",
			"SELECT a FROM tbl1",
			nil,
			true,
		},
		{
			"error with specified schema and no allowed schemas",
			"SELECT a FROM schema1.tbl1",
			nil,
			true,
		},
		{
			"no error on specified schema with matching allowed schema",
			"SELECT a FROM schema1.tbl1",
			[]string{"schema1"},
			false,
		},
		{
			"error on specified schema without matching allowed schema",
			"SELECT a FROM schema2.tbl1",
			[]string{"schema1"},
			true,
		},
		{
			"subquery in FROM clause with allowed schema",
			"SELECT t.x FROM (SELECT a AS x FROM schema1.tbl1) AS t",
			[]string{"schema1"},
			false,
		},
		{
			"subquery in FROM clause with disallowed schema",
			"SELECT t.x FROM (SELECT a AS x FROM schema2.tbl1) AS t",
			[]string{"schema1"},
			true,
		},
		{
			"subquery in WHERE clause with allowed schema",
			"SELECT a FROM tbl1 WHERE a IN (SELECT b FROM schema1.tbl2)",
			[]string{"schema1"},
			true,
		},
		{
			"subquery in WHERE clause with allowed schemas for both tables",
			"SELECT a FROM schema1.tbl1 WHERE a IN (SELECT b FROM schema1.tbl2)",
			[]string{"schema1"},
			false,
		},
		{
			"CTE with allowed schema",
			"WITH cte AS (SELECT a FROM schema1.tbl1) SELECT * FROM cte",
			[]string{"schema1"},
			false,
		},
		{
			"CTE with disallowed schema",
			"WITH cte AS (SELECT a FROM schema2.tbl1) SELECT * FROM cte",
			[]string{"schema1"},
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
			true,
		},
		{
			"join between schemas with all schemas allowed",
			"SELECT t1.a, t2.b FROM schema1.tbl1 t1 JOIN schema2.tbl2 t2 ON t1.id = t2.id",
			[]string{"schema1", "schema2"},
			false,
		},
		{
			"join between schemas with one schema not allowed",
			"SELECT t1.a, t2.b FROM schema1.tbl1 t1 JOIN schema2.tbl2 t2 ON t1.id = t2.id",
			[]string{"schema1"},
			true,
		},
		{
			"union with allowed schemas",
			"SELECT a FROM schema1.tbl1 UNION SELECT b FROM schema1.tbl2",
			[]string{"schema1"},
			false,
		},
		{
			"union with one disallowed schema",
			"SELECT a FROM schema1.tbl1 UNION SELECT b FROM schema2.tbl2",
			[]string{"schema1"},
			true,
		},
		{
			"window function with allowed schema",
			"SELECT a, ROW_NUMBER() OVER (PARTITION BY b ORDER BY c) FROM schema1.tbl1",
			[]string{"schema1"},
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
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)
			err := db.ValidateSQL(t.Context(), tt.sql, tt.allowedSchemas)
			if tt.wantErr {
				assert.Error(t, err, "expected error for SQL: %s", tt.sql)
			} else {
				assert.NoError(t, err, "unexpected error for SQL: %s", tt.sql)
			}
		})
	}
}
