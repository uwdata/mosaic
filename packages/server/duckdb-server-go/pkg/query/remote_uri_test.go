package query

import (
	"fmt"
	"os"
	"path/filepath"
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

	for _, prefix := range remoteURIPrefixes {
		t.Run(prefix, func(t *testing.T) {
			sql := fmt.Sprintf("SELECT * FROM read_parquet('%sbucket/file.parquet')", prefix)
			err := db.ValidateSQL(t.Context(), sql, newRemoteURILiteralValidator())
			require.ErrorIs(t, err, ErrAccessDenied)
			assert.EqualError(t, err, fmt.Sprintf(
				"query: access denied: remote URI prefix '%s' is not allowed in path argument to function 'read_parquet'",
				prefix,
			))
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
			name: "local path",
			sql:  "SELECT * FROM read_parquet('/var/data/file.parquet')",
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
			name: "case-sensitive prefix",
			sql:  "SELECT * FROM read_parquet('HTTPS://example.com/file.parquet')",
		},
		{
			name: "prefix split between literals",
			sql:  "SELECT * FROM read_parquet('gcs:/' || '/bucket/file.parquet')",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := db.ValidateSQL(t.Context(), tt.sql, newRemoteURILiteralValidator())
			if tt.wantPrefix == "" {
				assert.NoError(t, err)
				return
			}
			require.ErrorIs(t, err, ErrAccessDenied)
			assert.ErrorContains(t, err, fmt.Sprintf("remote URI prefix '%s'", tt.wantPrefix))
		})
	}
}

func TestRemoteURILiteralValidatorCountsOnlyUnnamedPositions(t *testing.T) {
	validator := newRemoteURILiteralValidator()
	validator.CheckNode(map[string]any{
		"type": "TABLE_FUNCTION",
		"function": map[string]any{
			"function_name": "read_parquet",
			"children": []any{
				map[string]any{
					"alias": "unreviewed_option",
					"class": "CONSTANT",
					"value": map[string]any{"value": "https://example.com/ignored"},
				},
				map[string]any{
					"class": "CONSTANT",
					"value": map[string]any{"value": "local.parquet"},
				},
			},
		},
	}, nil)

	assert.Empty(t, validator.Validate())
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
			err := db.ValidateSQL(t.Context(), tt.sql, newRemoteURILiteralValidator())
			if !tt.wantErr {
				assert.NoError(t, err)
				return
			}
			require.ErrorIs(t, err, ErrAccessDenied)
			assert.ErrorContains(t, err, "is not allowed in replacement scan")
		})
	}
}

func TestDBRemoteURILiteralRejection(t *testing.T) {
	path := filepath.Join(t.TempDir(), "local.csv")
	require.NoError(t, os.WriteFile(path, []byte("value\n42\n"), 0o600))

	db := setupTestDB(t, WithRemoteURILiteralRejection())

	data, _, err := db.QueryJSON(t.Context(), "SELECT * FROM read_csv("+quoteLiteral(path)+")", nil, false)
	require.NoError(t, err)
	assert.JSONEq(t, `[{"value": 42}]`, string(data))

	data, _, err = db.QueryJSON(t.Context(), "SELECT 'https://example.com' AS url WHERE url = 'https://example.com'", nil, false)
	require.NoError(t, err)
	assert.JSONEq(t, `[{"url": "https://example.com"}]`, string(data))

	_, _, err = db.QueryJSON(t.Context(), "SELECT * FROM read_csv('https://example.com/file.csv')", nil, false)
	require.ErrorIs(t, err, ErrAccessDenied)
	assert.ErrorContains(t, err, "remote URI prefix 'https://' is not allowed in path argument to function 'read_csv'")

	err = db.Exec(t.Context(), "SELECT 1")
	require.ErrorIs(t, err, ErrExecWithValidation)
}
