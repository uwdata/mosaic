package query

import (
	"testing"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFunctionListOptionsNormalize(t *testing.T) {
	tests := []struct {
		name string
		opt  func([]string) OptionFunc
		get  func(*Options) []string
	}{
		{
			name: "allowlist",
			opt:  WithFunctionAllowlist,
			get:  func(opts *Options) []string { return opts.FunctionAllowlist },
		},
		{
			name: "blocklist",
			opt:  WithFunctionBlocklist,
			get:  func(opts *Options) []string { return opts.FunctionBlocklist },
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			functions := []string{" MD5 ", "", " + ", "md5", " + "}
			opts := &Options{}

			require.NoError(t, tt.opt(functions)(opts))
			assert.Equal(t, []string{"md5", "+"}, tt.get(opts))

			functions[0] = "sha256"
			assert.Equal(t, []string{"md5", "+"}, tt.get(opts))
		})
	}
}

func TestWithFunctionAllowlistPreservesExplicitEmpty(t *testing.T) {
	opts := &Options{}

	assert.Nil(t, opts.FunctionAllowlist)
	require.NoError(t, WithFunctionAllowlist(nil)(opts))
	assert.NotNil(t, opts.FunctionAllowlist)
	assert.Empty(t, opts.FunctionAllowlist)
}

func TestNewNormalizesCustomFunctionOptions(t *testing.T) {
	connector, err := duckdb.NewConnector(":memory:", nil)
	require.NoError(t, err)

	db, err := New(t.Context(), connector, func(opts *Options) error {
		opts.FunctionAllowlist = []string{" MD5 ", "md5"}
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
			opts:    []OptionFunc{WithFunctionAllowlist(nil), WithFunctionBlocklist([]string{"md5"})},
			wantErr: true,
		},
		{
			name:    "blocklist before allowlist",
			opts:    []OptionFunc{WithFunctionBlocklist([]string{"md5"}), WithFunctionAllowlist([]string{"md5"})},
			wantErr: true,
		},
		{
			name: "empty blocklist remains a no-op",
			opts: []OptionFunc{WithFunctionAllowlist(nil), WithFunctionBlocklist([]string{"", " "})},
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
