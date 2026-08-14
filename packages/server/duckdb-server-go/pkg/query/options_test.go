package query

import (
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
		functions := resolveFunctionAllowlist(FunctionAllowlistOptions{})
		assert.Contains(t, functions, "+")
		assert.Contains(t, functions, "count_star")
		assert.Contains(t, functions, "json_serialize_sql")
		assert.Contains(t, functions, "st_x")
		assert.Contains(t, functions, "sum")
		assert.NotContains(t, functions, "st_read")
		assert.NotContains(t, functions, "st_transform")
	})

	t.Run("include and exclude", func(t *testing.T) {
		functions := resolveFunctionAllowlist(FunctionAllowlistOptions{
			Include: []string{" MD5 ", "sum"},
			Exclude: []string{" SUM ", "+"},
		})
		assert.Contains(t, functions, "md5")
		assert.NotContains(t, functions, "sum")
		assert.NotContains(t, functions, "+")
	})

	t.Run("defaults disabled", func(t *testing.T) {
		functions := resolveFunctionAllowlist(FunctionAllowlistOptions{
			DisableDefaults: true,
			Include:         []string{" MD5 ", "md5"},
		})
		assert.Equal(t, []string{"md5"}, functions)

		functions = resolveFunctionAllowlist(FunctionAllowlistOptions{DisableDefaults: true})
		assert.NotNil(t, functions)
		assert.Empty(t, functions)
	})
}

func TestNewNormalizesCustomFunctionOptions(t *testing.T) {
	connector, err := duckdb.NewConnector(":memory:", nil)
	require.NoError(t, err)

	db, err := New(t.Context(), connector, func(opts *Options) error {
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

	_, _, err = db.QueryJSON(t.Context(), "SELECT md5('mosaic')", nil, false)
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
			connector, err := duckdb.NewConnector(":memory:", nil)
			require.NoError(t, err)

			db, err := New(t.Context(), connector, tt.opts...)
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
