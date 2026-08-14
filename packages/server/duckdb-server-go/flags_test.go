package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOptionalCommaListFlag(t *testing.T) {
	var flag optionalCommaListFlag

	assert.False(t, flag.set)
	assert.Empty(t, flag.values)

	require.NoError(t, flag.Set("md5,range"))
	require.NoError(t, flag.Set("+"))
	assert.True(t, flag.set)
	assert.Equal(t, []string{"md5", "range", "+"}, flag.values)
	assert.Equal(t, "md5,range,+", flag.String())
}

func TestOptionalCommaListFlagPreservesExplicitEmpty(t *testing.T) {
	var flag optionalCommaListFlag

	require.NoError(t, flag.Set(""))
	assert.True(t, flag.set)
	assert.Empty(t, flag.values)
	assert.Empty(t, flag.String())
}

func TestConfigureFunctionAllowlist(t *testing.T) {
	tests := []struct {
		name       string
		include    optionalCommaListFlag
		exclude    optionalCommaListFlag
		defaults   bool
		configured bool
	}{
		{name: "omitted", defaults: true},
		{name: "explicit defaults", include: optionalCommaListFlag{set: true}, defaults: true, configured: true},
		{name: "include", include: optionalCommaListFlag{values: []string{"md5"}, set: true}, defaults: true, configured: true},
		{name: "exclude", exclude: optionalCommaListFlag{values: []string{"sum"}, set: true}, defaults: true, configured: true},
		{name: "defaults disabled", defaults: false, configured: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			options, configured := configureFunctionAllowlist(tt.include, tt.exclude, tt.defaults)
			assert.Equal(t, tt.configured, configured)
			assert.Equal(t, tt.include.values, options.Include)
			assert.Equal(t, tt.exclude.values, options.Exclude)
			assert.Equal(t, !tt.defaults, options.DisableDefaults)
		})
	}
}
