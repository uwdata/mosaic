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
