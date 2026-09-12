package query

import (
	"os"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWithFunctionBlocklistNormalizes(t *testing.T) {
	functions := []string{" MD5 ", "", " + ", "md5", " + "}
	opts := &Options{}

	require.NoError(t, WithFunctionBlocklist(functions)(opts))
	assert.Equal(t, []string{"md5", "+"}, opts.FunctionBlocklist)

	functions[0] = "sha256"
	assert.Equal(t, []string{"md5", "+"}, opts.FunctionBlocklist)
}

func TestWithFunctionAllowlistCopiesOptions(t *testing.T) {
	include := []string{"MD5"}
	exclude := []string{"SUM"}
	option := WithFunctionAllowlist(FunctionAllowlistOptions{
		Include: include,
		Exclude: exclude,
	})
	include[0] = "sha256"
	exclude[0] = "avg"

	opts := &Options{}
	require.NoError(t, option(opts))
	require.NotNil(t, opts.FunctionAllowlist)
	assert.Equal(t, []string{"MD5"}, opts.FunctionAllowlist.Include)
	assert.Equal(t, []string{"SUM"}, opts.FunctionAllowlist.Exclude)

	opts.FunctionAllowlist.Include[0] = "mutated"
	second := &Options{}
	require.NoError(t, option(second))
	assert.Equal(t, []string{"MD5"}, second.FunctionAllowlist.Include)
}

func TestResolveFunctionAllowlist(t *testing.T) {
	t.Run("defaults", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{}))
		for _, q := range []string{"SELECT 1+2", "SELECT count(*)", "SELECT json_serialize_sql('SELECT 1')", "SELECT sum(1)"} {
			_, err := db.QueryArrow(t.Context(), q, nil)
			require.NoError(t, err)
		}
		for _, q := range []string{"SELECT * FROM st_read('x')", "SELECT st_transform(NULL, 'a', 'b')"} {
			_, err := db.QueryArrow(t.Context(), q, nil)
			requireViolation(t, err, "function")
		}
	})

	t.Run("include and exclude", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{
			Include: []string{" MD5 ", "sum"},
			Exclude: []string{" SUM ", "+"},
		}))
		_, err := db.QueryArrow(t.Context(), "SELECT md5('x')", nil)
		require.NoError(t, err)
		for _, q := range []string{"SELECT sum(1)", "SELECT 1+2"} {
			_, err := db.QueryArrow(t.Context(), q, nil)
			requireViolation(t, err, "function")
		}
	})

	t.Run("defaults disabled", func(t *testing.T) {
		db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{
			DisableDefaults: true,
			Include:         []string{" MD5 ", "md5"},
		}))
		_, err := db.QueryArrow(t.Context(), "SELECT md5('x')", nil)
		require.NoError(t, err)
		empty := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{DisableDefaults: true}))
		_, err = empty.QueryArrow(t.Context(), "SELECT md5('x')", nil)
		requireViolation(t, err, "function")
	})
}

func TestNewNormalizesCustomFunctionOptions(t *testing.T) {
	connector, err := duckdb.NewConnector(":memory:?allow_unsigned_extensions=true", nil)
	require.NoError(t, err)

	db, err := New(t.Context(), connector, WithGatekeeperExtension(os.Getenv("GATEKEEPER_EXTENSION")), func(opts *Options) error {
		opts.FunctionAllowlist = &FunctionAllowlistOptions{
			DisableDefaults: true,
			Include:         []string{" MD5 ", "md5"},
		}
		return nil
	})
	require.NoError(t, err)
	t.Cleanup(func() {
		db.Close()
		require.NoError(t, connector.Close())
	})

	_, err = db.QueryArrow(t.Context(), "SELECT md5('mosaic')", nil)
	require.NoError(t, err)
}

func TestFunctionAllowlistAndBlocklistAreMutuallyExclusive(t *testing.T) {
	tests := []struct {
		name    string
		opts    []OptionFunc
		wantErr bool
	}{
		{
			name:    "allowlist before blocklist",
			opts:    []OptionFunc{WithFunctionAllowlist(FunctionAllowlistOptions{}), WithFunctionBlocklist([]string{"md5"})},
			wantErr: true,
		},
		{
			name:    "blocklist before allowlist",
			opts:    []OptionFunc{WithFunctionBlocklist([]string{"md5"}), WithFunctionAllowlist(FunctionAllowlistOptions{})},
			wantErr: true,
		},
		{
			name: "empty blocklist remains a no-op",
			opts: []OptionFunc{WithFunctionAllowlist(FunctionAllowlistOptions{}), WithFunctionBlocklist([]string{"", " "})},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			connector, err := duckdb.NewConnector(":memory:?allow_unsigned_extensions=true", nil)
			require.NoError(t, err)

			opts := append([]OptionFunc{WithGatekeeperExtension(os.Getenv("GATEKEEPER_EXTENSION"))}, tt.opts...)
			db, err := New(t.Context(), connector, opts...)
			if tt.wantErr {
				require.Nil(t, db)
				require.EqualError(t, err, "query: function allowlist and blocklist cannot both be configured")
			} else {
				require.NoError(t, err)
				db.Close()
			}
			require.NoError(t, connector.Close())
		})
	}
}
