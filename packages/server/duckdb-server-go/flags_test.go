package main

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func TestOptionalCommaListFlag(t *testing.T) {
	var flag optionalCommaListFlag
	require.NoError(t, flag.Set("Origin,X-Tenant"))
	require.NoError(t, flag.Set("Accept-Encoding"))
	require.Equal(t, "Origin,X-Tenant,Accept-Encoding", flag.String())
}

func TestGatekeeperFlagPreservesDocument(t *testing.T) {
	for _, document := range []string{` {"version":1,"options":{"allowed_tables":[]}} `, `null`, ``, `{"version":1,"version":2}`} {
		var flag gatekeeperFlag
		require.Nil(t, flag.document)
		require.NoError(t, flag.Set(document))
		require.Equal(t, document, *flag.document)
		require.Equal(t, document, flag.String())
		require.Error(t, flag.Set(document))
	}
}
