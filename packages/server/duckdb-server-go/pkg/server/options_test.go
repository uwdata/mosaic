package server

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNewRejectsInvalidConfiguration(t *testing.T) {
	_, err := New(nil)
	require.Error(t, err)

	_, err = applyOptions([]Option{nil})
	require.Error(t, err)
}

func TestWithSchemaMatchHeadersCopiesConfiguration(t *testing.T) {
	headers := []string{" X-Tenant "}
	option := WithSchemaMatchHeaders(headers...)
	headers[0] = "X-Changed"

	cfg, err := applyOptions([]Option{option})
	require.NoError(t, err)
	require.Equal(t, []string{" X-Tenant "}, cfg.schemaMatchHeaders)
}
