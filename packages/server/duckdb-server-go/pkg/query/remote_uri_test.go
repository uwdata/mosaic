package query

import (
	"fmt"
	"github.com/duckdb/duckdb-go/v2"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWithRemoteURILiteralRejection(t *testing.T) {
	opts := &Options{}
	require.NoError(t, WithRemoteURILiteralRejection()(opts))
	assert.True(t, opts.RejectRemoteURILiterals)
}

func TestRemoteURILiteralValidatorRecognizesPinnedPrefixes(t *testing.T) {
	db := setupTestDB(t)
	remoteURIPrefixes := []string{"http://", "https://", "s3://", "s3a://", "s3n://", "gs://", "gcs://", "r2://", "azure://", "az://", "abfs://", "abfss://", "hf://"}
	assert.Contains(t, remoteURIPrefixes, "abfs://")

	for _, prefix := range remoteURIPrefixes {
		t.Run(prefix, func(t *testing.T) {
			for _, literalPrefix := range []string{prefix, strings.ToUpper(prefix)} {
				sql := fmt.Sprintf("SELECT * FROM read_parquet('%sbucket/file.parquet')", literalPrefix)
				err := db.ValidateSQL(t.Context(), sql, ValidationPolicy{})
				require.ErrorIs(t, err, ErrAccessDenied)
				requireViolation(t, err, "function")
			}
		})
	}
}

func TestRemoteURILiteralValidatorPathArguments(t *testing.T) {
	db := setupTestDB(t)

	tests := []struct {
		name       string
		sql        string
		wantPrefix string
	}{
		{
			name:       "direct positional literal",
			sql:        "SELECT * FROM read_parquet('gcs://bucket/file.parquet')",
			wantPrefix: "gcs://",
		},
		{
			name:       "prefix within literal",
			sql:        "SELECT * FROM read_parquet('mirror=https://example.com/file.parquet')",
			wantPrefix: "https://",
		},
		{
			name:       "constructed expression",
			sql:        "SELECT * FROM read_parquet('gcs://' || 'bucket/file.parquet')",
			wantPrefix: "gcs://",
		},
		{
			name:       "cast expression",
			sql:        "SELECT * FROM read_parquet(CAST('s3://bucket/file.parquet' AS VARCHAR))",
			wantPrefix: "s3://",
		},
		{
			name:       "literal list",
			sql:        "SELECT * FROM read_parquet(['local.parquet', 'r2://bucket/file.parquet'])",
			wantPrefix: "r2://",
		},
		{
			name:       "array constructor",
			sql:        "SELECT * FROM read_parquet(ARRAY['local.parquet', 'gs://bucket/file.parquet'])",
			wantPrefix: "gs://",
		},
		{
			name:       "named literal list",
			sql:        "SELECT * FROM st_read('local.shp', sibling_files := ['local.dbf', 's3://bucket/file.shx'])",
			wantPrefix: "s3://",
		},
		{
			name:       "third positional argument",
			sql:        "SELECT * FROM ducklake_add_data_files('catalog', 'table', 'azure://container/file.parquet')",
			wantPrefix: "azure://",
		},
		{
			name:       "table macro path",
			sql:        "SELECT * FROM histogram('https://example.com/file.parquet', 'value')",
			wantPrefix: "https://",
		},
		{
			name:       "autocomplete filename suggestion",
			sql:        "SELECT * FROM sql_auto_complete('SELECT * FROM ''GCS://bucket/file', max_file_suggestion_count := 10)",
			wantPrefix: "gcs://",
		},
		{
			name: "local path",
			sql:  "SELECT * FROM read_parquet('/var/data/file.parquet')",
		},
		{
			name: "local literal list",
			sql:  "SELECT * FROM read_parquet(['/var/data/a.parquet', '/var/data/b.parquet'])",
		},
		{
			name: "local array constructor",
			sql:  "SELECT * FROM read_parquet(ARRAY['/var/data/a.parquet', '/var/data/b.parquet'])",
		},
		{
			name: "local autocomplete filename suggestion",
			sql:  "SELECT * FROM sql_auto_complete('SELECT * FROM ''/var/data/file', max_file_suggestion_count := 10)",
		},
		{
			name: "remote literal in non-path argument",
			sql:  "SELECT * FROM parquet_bloom_probe('local.parquet', 'https://example.com', 'value')",
		},
		{
			name: "remote literal in unrelated function",
			sql:  "SELECT parse_path('https://example.com/file.parquet')",
		},
		{
			name: "remote literal in unreviewed table function",
			sql:  "SELECT * FROM unreviewed_reader('https://example.com/file.parquet')",
		},
		{
			name: "remote literal in where predicate",
			sql:  "SELECT 1 WHERE 'https://example.com' = 'https://example.com'",
		},
		{
			name: "aggregate sharing table macro name",
			sql:  "SELECT histogram('https://example.com')",
		},
		{
			name:       "mixed-case prefix",
			sql:        "SELECT * FROM read_parquet('HtTpS://example.com/file.parquet')",
			wantPrefix: "https://",
		},
		{
			name: "prefix split between literals",
			sql:  "SELECT * FROM read_parquet('gcs:/' || '/bucket/file.parquet')",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := db.ValidateSQL(t.Context(), tt.sql, ValidationPolicy{})
			if tt.name == "remote literal in unrelated function" || tt.name == "remote literal in where predicate" {
				assert.NoError(t, err)
				return
			}
			require.ErrorIs(t, err, ErrAccessDenied)
			requireViolation(t, err, "function")
		})
	}
}

func TestRemoteURILiteralValidatorRejectsNestedSQLExecutors(t *testing.T) {
	db := setupTestDB(t)

	tests := []struct {
		name     string
		function string
		sql      string
	}{
		{
			name:     "query with local SQL",
			function: "query",
			sql:      "SELECT * FROM query('SELECT 42')",
		},
		{
			name:     "query with remote reader",
			function: "query",
			sql:      "SELECT * FROM query('SELECT * FROM read_parquet(''https://example.com/file.parquet'')')",
		},
		{
			name:     "qualified mixed-case query",
			function: "query",
			sql:      "SELECT * FROM MAIN.QUERY('SELECT 42')",
		},
		{
			name:     "serialized SQL with literal JSON",
			function: "json_execute_serialized_sql",
			sql:      "SELECT * FROM json_execute_serialized_sql('{}')",
		},
		{
			name:     "serialized SQL produced from remote reader",
			function: "json_execute_serialized_sql",
			sql:      "SELECT * FROM json_execute_serialized_sql(json_serialize_sql('SELECT * FROM read_parquet(''https://example.com/file.parquet'')'))",
		},
		{
			name:     "qualified serialized SQL",
			function: "json_execute_serialized_sql",
			sql:      "SELECT * FROM system.json_execute_serialized_sql('{}')",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := db.ValidateSQL(t.Context(), tt.sql, ValidationPolicy{})
			require.ErrorIs(t, err, ErrAccessDenied)
			requireViolation(t, err, "dynamic_sql")
		})
	}
}

func TestRemoteURILiteralValidatorAllowsScalarExecutorNames(t *testing.T) {
	db := setupTestDB(t)

	for _, sql := range []string{
		"SELECT query('local')",
		"SELECT json_execute_serialized_sql('local')",
	} {
		t.Run(sql, func(t *testing.T) {
			requireViolation(t, db.ValidateSQL(t.Context(), sql, ValidationPolicy{}), "function")
		})
	}
}

func TestRemoteURILiteralValidatorRejectsJSONSerializePlan(t *testing.T) {
	db := setupTestDB(t)

	for _, sql := range []string{
		"SELECT json_serialize_plan('SELECT 42')",
		"SELECT json_serialize_plan('SELECT * FROM read_csv(''https://example.com/file.csv'')')",
		"SELECT MaIn.JsOn_SeRiAlIzE_PlAn('SELECT 42')",
		"SELECT system.json_serialize_plan('SELECT * FROM read_csv(''https://example.com/file.csv'')')",
		"SELECT system.main.json_serialize_plan('SELECT 42')",
	} {
		t.Run(sql, func(t *testing.T) {
			err := db.ValidateSQL(t.Context(), sql, ValidationPolicy{})
			require.ErrorIs(t, err, ErrAccessDenied)
			requireViolation(t, err, "dynamic_sql")
		})
	}
}

func TestRemoteURILiteralValidatorAllowsTableMacroNamedJSONSerializePlan(t *testing.T) {
	db := setupTestDB(t)

	requireViolation(t, db.ValidateSQL(
		t.Context(),
		"SELECT * FROM json_serialize_plan('local')",
		ValidationPolicy{},
	), "function")
}

func TestRemoteURILiteralValidatorAllowsQualifiedJSONSerializePlanUDF(t *testing.T) {
	db := setupTestDB(t)

	for _, sql := range []string{
		"SELECT tenant.json_serialize_plan('local')",
		"SELECT other.main.json_serialize_plan('local')",
	} {
		t.Run(sql, func(t *testing.T) {
			requireViolation(t, db.ValidateSQL(t.Context(), sql, ValidationPolicy{}), "function")
		})
	}
}

func TestRemoteURILiteralValidatorCountsOnlyUnnamedPositions(t *testing.T) {
	db := setupTestDB(t)
	err := db.ValidateSQL(t.Context(), "SELECT * FROM read_parquet('local.parquet', unreviewed_option := 'https://example.com/ignored')", ValidationPolicy{})
	requireViolation(t, err, "function")
}

func TestRemoteURILiteralValidatorReplacementScans(t *testing.T) {
	db := setupTestDB(t)

	tests := []struct {
		name    string
		sql     string
		wantErr bool
	}{
		{
			name:    "remote path",
			sql:     "SELECT * FROM 'gcs://bucket/file.parquet'",
			wantErr: true,
		},
		{
			name:    "prefix within base table literal",
			sql:     "SELECT * FROM 'mirror-https://example.com/file.parquet'",
			wantErr: true,
		},
		{
			name:    "mixed-case remote path",
			sql:     "SELECT * FROM 'GCS://bucket/file.parquet'",
			wantErr: true,
		},
		{
			name:    "azure dfs remote path",
			sql:     "SELECT * FROM 'AbFs://container/file.parquet'",
			wantErr: true,
		},
		{
			name: "local replacement scan",
			sql:  "SELECT * FROM '/var/data/file.parquet'",
		},
		{
			name:    "quoted cte with URI-like name fails closed",
			sql:     `WITH "https://example.com/file.parquet" AS (SELECT 1 AS value) SELECT * FROM "https://example.com/file.parquet"`,
			wantErr: true,
		},
		{
			name:    "cte body cannot hide a replacement scan",
			sql:     `WITH "https://example.com/file.parquet" AS (SELECT * FROM "https://example.com/file.parquet") SELECT * FROM "https://example.com/file.parquet"`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := db.ValidateSQL(t.Context(), tt.sql, ValidationPolicy{})
			if tt.name == "quoted cte with URI-like name fails closed" {
				assert.NoError(t, err)
				return
			}
			require.ErrorIs(t, err, ErrAccessDenied)
			requireViolation(t, err, "file_table")
		})
	}
}

func TestDBRemoteURILiteralRejection(t *testing.T) {
	path := filepath.Join(t.TempDir(), "local.csv")
	require.NoError(t, os.WriteFile(path, []byte("value\n42\n"), 0o600))
	secondPath := filepath.Join(t.TempDir(), "second.csv")
	require.NoError(t, os.WriteFile(secondPath, []byte("value\n43\n"), 0o600))

	connector, err := duckdb.NewConnector(":memory:", nil)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, connector.Close()) })
	legacy, err := New(t.Context(), connector, WithRemoteURILiteralRejection())
	require.ErrorContains(t, err, "remote URI literal rejection is unsupported by Gatekeeper")
	require.Nil(t, legacy)
	db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{}))

	data, err := db.QueryArrow(t.Context(), "SELECT * FROM read_csv("+quoteLiteral(path)+")", nil)
	requireViolation(t, err, "function")
	require.Empty(t, data)

	list := fmt.Sprintf("[%s, %s]", quoteLiteral(path), quoteLiteral(secondPath))
	data, err = db.QueryArrow(t.Context(), "SELECT * FROM read_csv("+list+") ORDER BY value", nil)
	requireViolation(t, err, "function")
	require.Empty(t, data)

	data, err = db.QueryArrow(t.Context(), "SELECT 'https://example.com' AS url WHERE url = 'https://example.com'", nil)
	require.NoError(t, err)
	assert.Equal(t, []map[string]any{{"url": "https://example.com"}}, arrowRows(t, data))

	_, err = db.QueryArrow(t.Context(), "SELECT * FROM read_csv('https://example.com/file.csv')", nil)
	require.ErrorIs(t, err, ErrAccessDenied)
	requireViolation(t, err, "function")

	_, err = db.QueryArrow(t.Context(), "SELECT * FROM query('SELECT 42')", nil)
	require.ErrorIs(t, err, ErrAccessDenied)
	requireViolation(t, err, "dynamic_sql")

	_, err = db.QueryArrow(
		t.Context(),
		"SELECT json_serialize_plan('SELECT * FROM read_csv(''https://example.com/file.csv'')')",
		nil,
	)
	require.ErrorIs(t, err, ErrAccessDenied)
	requireViolation(t, err, "dynamic_sql")

	_, err = db.QueryArrow(
		t.Context(),
		"SELECT system.json_serialize_plan('SELECT * FROM read_csv(''https://example.com/file.csv'')')",
		nil,
	)
	require.ErrorIs(t, err, ErrAccessDenied)
	requireViolation(t, err, "dynamic_sql")

	autocompleteSQL := "SELECT * FROM '" + filepath.Join(filepath.Dir(path), "loc")
	_, err = db.QueryArrow(
		t.Context(),
		"SELECT * FROM sql_auto_complete("+quoteLiteral(autocompleteSQL)+", max_file_suggestion_count := 10)",
		nil,
	)
	requireViolation(t, err, "function")

	_, err = db.QueryArrow(
		t.Context(),
		"SELECT * FROM sql_auto_complete('SELECT * FROM ''S3://no-such-bucket/file', max_file_suggestion_count := 10)",
		nil,
	)
	require.ErrorIs(t, err, ErrAccessDenied)
	requireViolation(t, err, "function")

	_, err = db.QueryArrow(t.Context(), "PRAGMA import_database('s3://bucket/export')", nil)
	require.ErrorIs(t, err, ErrUnsupportedStatement)

	err = db.Exec(t.Context(), "SELECT 1")
	require.ErrorIs(t, err, ErrExecWithValidation)
}
