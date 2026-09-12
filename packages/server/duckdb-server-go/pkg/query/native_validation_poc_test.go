package query

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/require"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/functionset"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/functionset/remoteread"
)

const nativeValidationSQL = `SELECT mosaic_validate_ast(
	system.main.json_serialize_sql(?::VARCHAR, skip_default := true, skip_empty := true, skip_null := true)::VARCHAR,
	?::VARCHAR)`

type nativePolicy struct {
	CheckSchemas     bool                                `json:"check_schemas"`
	AllowedSchemas   []string                            `json:"allowed_schemas"`
	CheckFunctions   bool                                `json:"check_functions"`
	AllowedFunctions []string                            `json:"allowed_functions"`
	BlockedFunctions []string                            `json:"blocked_functions"`
	RejectRemote     bool                                `json:"reject_remote_uris"`
	RemoteReaders    map[string]remoteread.PathArguments `json:"remote_readers,omitempty"`
}

func policyJSON(policy nativePolicy) string {
	if policy.AllowedSchemas == nil {
		policy.AllowedSchemas = []string{}
	}
	if policy.AllowedFunctions == nil {
		policy.AllowedFunctions = []string{}
	}
	if policy.BlockedFunctions == nil {
		policy.BlockedFunctions = []string{}
	}
	if policy.RejectRemote {
		policy.RemoteReaders = make(map[string]remoteread.PathArguments)
		for _, name := range remoteread.FunctionNames() {
			policy.RemoteReaders[name], _ = remoteread.Lookup(name)
		}
	}
	data, err := json.Marshal(policy)
	if err != nil {
		panic(err)
	}
	return string(data)
}

type nativeResult struct {
	Allowed    bool     `json:"allowed"`
	Code       string   `json:"code"`
	Violations []string `json:"violations"`
}

func setupNativeValidation(t testing.TB) *DB {
	t.Helper()
	path := os.Getenv("MOSAIC_NATIVE_VALIDATION_EXTENSION")
	if path == "" {
		t.Skip("set MOSAIC_NATIVE_VALIDATION_EXTENSION to run the opt-in extension PoC")
	}
	path, err := filepath.Abs(path)
	require.NoError(t, err)
	connector, err := duckdb.NewConnector(":memory:?allow_unsigned_extensions=true", func(execer driver.ExecerContext) error {
		_, err := execer.ExecContext(context.Background(), "LOAD "+quoteLiteral(path), nil)
		return err
	})
	require.NoError(t, err)
	db, err := New(context.Background(), connector)
	require.NoError(t, err)
	t.Cleanup(func() { db.Close(); require.NoError(t, connector.Close()) })
	return db
}

func nativeCheck(ctx context.Context, db *DB, sql, policy string) (nativeResult, error) {
	var text string
	err := db.db.QueryRowContext(ctx, nativeValidationSQL, sql, policy).Scan(&text)
	var result nativeResult
	if err == nil {
		err = json.Unmarshal([]byte(text), &result)
	}
	return result, err
}

func TestNativeValidationPoC(t *testing.T) {
	db := setupNativeValidation(t)
	for _, tt := range []struct {
		name, sql string
		allowed   bool
	}{
		{"literal", "SELECT 1", true},
		{"schema", "SELECT * FROM tenant_a.t", true},
		{"unauthorized", "SELECT * FROM tenant_b.t", false},
		{"unqualified", "SELECT * FROM t", false},
		{"nested", "SELECT * FROM tenant_a.t WHERE x IN (SELECT x FROM tenant_b.t)", false},
		{"cte", "WITH t AS (SELECT * FROM tenant_a.t) SELECT * FROM t", true},
		{"cte nested scope", "SELECT * FROM secret WHERE EXISTS (WITH secret AS (SELECT 1) SELECT * FROM secret)", false},
		{"cte other statement", "WITH t AS (SELECT 1) SELECT * FROM t; SELECT * FROM t", false},
		{"cte self", "WITH t AS (SELECT * FROM t) SELECT * FROM t", false},
		{"cte forward", "WITH a AS (SELECT * FROM b), b AS (SELECT 1) SELECT * FROM a", false},
		{"cte previous", "WITH z AS (SELECT 1), a AS (SELECT * FROM z) SELECT * FROM a", true},
		{"cte case", "WITH Cte AS (SELECT 1) SELECT * FROM CTE", true},
		{"recursive", "WITH RECURSIVE t AS (SELECT 1 AS n UNION ALL SELECT n+1 FROM t WHERE n<3) SELECT * FROM t", true},
		{"recursive seed", "WITH RECURSIVE t AS (SELECT * FROM t UNION ALL SELECT 1 WHERE false) SELECT * FROM t", false},
		{"shadow", "WITH t AS (SELECT 1) SELECT * FROM (WITH t AS (SELECT * FROM t) SELECT * FROM t)", true},
		{"catalog", "SELECT * FROM other.tenant_a.t", false},
		{"catalog function", "SELECT other.main.md5('x')", false},
		{"show", "SHOW TABLES FROM tenant_a", true},
		{"show all", "SHOW ALL TABLES", false},
		{"describe", "DESCRIBE tenant_a.t", true},
		{"ddl", "CREATE TABLE tenant_a.t(x INT)", false},
		{"drop", "DROP TABLE tenant_a.t", false},
		{"dml", "DELETE FROM tenant_a.t RETURNING *", false},
		{"mixed", "SELECT 1; DROP TABLE tenant_a.t", false},
		{"parser", "SELECT * FROM", false},
		{"values", "VALUES (1),(2)", true},
		{"case cast", "SELECT CASE WHEN x BETWEEN 1 AND 3 THEN x::VARCHAR ELSE NULL END FROM tenant_a.t", true},
		{"window", "SELECT sum(x) OVER (PARTITION BY y ORDER BY z) FROM tenant_a.t", true},
		{"star replace", "SELECT * REPLACE (upper(x) AS x) FROM tenant_a.t", true},
		{"lambda", "SELECT list_transform([1,2], lambda x: x+1)", true},
		{"pivot", "SELECT * FROM tenant_a.t PIVOT (sum(x) FOR y IN (1,2))", true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			result, err := nativeCheck(t.Context(), db, tt.sql, policyJSON(nativePolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}}))
			require.NoError(t, err)
			require.Equal(t, tt.allowed, result.Allowed, "%+v", result)
		})
	}
}

func TestNativeValidationFunctionsAndRemote(t *testing.T) {
	db := setupNativeValidation(t)
	for _, policy := range []nativePolicy{
		{CheckFunctions: true, AllowedFunctions: []string{"sum", "+"}},
		{BlockedFunctions: []string{"md5", "range"}},
	} {
		for _, sql := range []string{"SELECT md5('x'), md5('y')", "SELECT md5(x) OVER () FROM tenant_a.t", "SELECT * FROM range(3)", "SELECT * FROM tenant_a.t a JOIN tenant_a.t b ON md5(a.x)=b.x"} {
			result, err := nativeCheck(t.Context(), db, sql, policyJSON(policy))
			require.NoError(t, err)
			require.False(t, result.Allowed, "%+v", result)
			if strings.Contains(sql, "md5('y')") {
				require.Contains(t, strings.Join(result.Violations, "\n"), "2 occurrences")
			}
		}
	}
	for _, tt := range []struct {
		sql     string
		allowed bool
	}{
		{"SELECT * FROM read_parquet('s3://bucket/file')", false},
		{"SELECT * FROM read_parquet(['local','HTTPS://example.com/file'])", false},
		{"SELECT * FROM read_parquet('local.parquet')", true},
		{"SELECT parse_path('s3://bucket/file')", true},
		{"SELECT * FROM query('SELECT 1')", false},
		{"SELECT json_serialize_plan('SELECT 1')", false},
		{"SELECT * FROM st_read('local',sibling_files:=['s3://bucket/file'])", false},
	} {
		result, err := nativeCheck(t.Context(), db, tt.sql, policyJSON(nativePolicy{RejectRemote: true}))
		require.NoError(t, err)
		require.Equal(t, tt.allowed, result.Allowed, "%+v", result)
	}
}

func TestNativeValidationMalformedAndVectorized(t *testing.T) {
	db := setupNativeValidation(t)
	for _, kind := range []string{"INSERT_QUERY_NODE", "UPDATE_QUERY_NODE", "DELETE_QUERY_NODE", "COPY_QUERY_NODE"} {
		ast := `{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[],"from_table":{"type":"EMPTY"},"cte_map":{"map":[{"key":"write","value":{"query":{"node":{"type":"` + kind + `"}}}}]}}}]}`
		var text string
		require.NoError(t, db.db.QueryRowContext(t.Context(), "SELECT mosaic_validate_ast(?, '{}')", ast).Scan(&text))
		require.Contains(t, text, `"code":"unsupported"`)
	}
	for _, policy := range []string{`{"check_functions":true,"blocked_functions":["md5"]}`, `{"check_schemas":"true"}`, `{"unknown":true}`, `{"check_schemas":false,"check_schemas":true}`} {
		result, err := nativeCheck(t.Context(), db, "SELECT 1", policy)
		require.NoError(t, err)
		require.False(t, result.Allowed)
		require.Equal(t, "invalid_input", result.Code)
	}
	for _, input := range []string{"SELECT 1", "SELECT sum(i)+1 FROM range(3) t(i)"} {
		result, err := nativeCheck(t.Context(), db, input, policyJSON(nativePolicy{CheckFunctions: true, AllowedFunctions: functionset.DefaultFunctions()}))
		require.NoError(t, err)
		require.True(t, result.Allowed, "%+v", result)
	}
	for _, ast := range []string{`{}`, `{"error":false,"statements":[{"node":{"type":"DELETE_QUERY_NODE"}}]}`, `{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[],"from_table":{"type":"FUTURE_TABLE"}}}]}`, `{"error":false,"statements":[{"node":{"type":"SELECT_NODE","select_list":[{"class":"FUNCTION","type":"FUTURE_FUNCTION","function_name":"sum"}],"from_table":{"type":"EMPTY"}}}]}`} {
		var text string
		require.NoError(t, db.db.QueryRowContext(t.Context(), "SELECT mosaic_validate_ast(?, '{}')", ast).Scan(&text))
		require.Contains(t, text, `"allowed":false`)
	}
	var denied int
	err := db.db.QueryRowContext(t.Context(), `SELECT count(*) FROM (
		SELECT mosaic_validate_ast(system.main.json_serialize_sql(CASE WHEN i%2=0 THEN 'SELECT 1' ELSE 'DROP TABLE t' END, skip_default:=true, skip_empty:=true, skip_null:=true)::VARCHAR,'{}')::JSON AS result
		FROM range(5000) t(i)
	) WHERE (result->>'allowed')='false'`).Scan(&denied)
	require.NoError(t, err)
	require.Equal(t, 2500, denied)
	var text string
	require.NoError(t, db.db.QueryRowContext(t.Context(), "SELECT mosaic_validate_ast(NULL,'{}')").Scan(&text))
	require.Contains(t, text, `"allowed":false`)
}

func TestNativeValidationConcurrent(t *testing.T) {
	db := setupNativeValidation(t)
	var wg sync.WaitGroup
	errs := make(chan error, 8)
	for i := range 8 {
		wg.Go(func() {
			for range 20 {
				result, err := nativeCheck(t.Context(), db, "SELECT * FROM tenant_a.t", policyJSON(nativePolicy{CheckSchemas: true, AllowedSchemas: []string{fmt.Sprintf("tenant_%d", i)}}))
				if err != nil || result.Allowed {
					errs <- fmt.Errorf("%+v: %v", result, err)
					return
				}
			}
		})
	}
	wg.Wait()
	close(errs)
	for err := range errs {
		require.NoError(t, err)
	}
}

func BenchmarkNativeValidationPoC(b *testing.B) {
	db := setupNativeValidation(b)
	for _, test := range []struct{ name, sql string }{
		{"simple", "SELECT * FROM tenant_a.orders"},
		{"cte", "WITH a AS (SELECT id,sum(value) AS total FROM tenant_a.orders GROUP BY id) SELECT * FROM a WHERE total > (SELECT avg(value) FROM tenant_a.orders)"},
		{"deep20", "SELECT * FROM " + strings.Repeat("(SELECT * FROM ", 20) + "tenant_a.orders" + strings.Repeat(") t", 20)},
	} {
		for _, mode := range []string{"go", "native", "native_allowlist"} {
			b.Run(test.name+"/"+mode, func(b *testing.B) {
				policy := nativePolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}}
				if mode == "native_allowlist" {
					policy.CheckFunctions = true
					policy.AllowedFunctions = functionset.DefaultFunctions()
				}
				encoded := policyJSON(policy)
				for b.Loop() {
					if mode == "go" {
						if err := db.ValidateSQL(b.Context(), test.sql, newBaseTableValidator([]string{"tenant_a"})); err != nil {
							b.Fatal(err)
						}
					} else {
						result, err := nativeCheck(b.Context(), db, test.sql, encoded)
						if err != nil || !result.Allowed {
							b.Fatal(result, err)
						}
					}
				}
			})
		}
	}
}
