package server

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestNewRejectsInvalidConfiguration(t *testing.T) {
	_, err := New(nil)
	require.Error(t, err)

	_, err = applyOptions([]Option{nil})
	require.Error(t, err)
}

func TestWithCORSRejectsInvalidConfiguration(t *testing.T) {
	tests := []Option{
		WithCORS(CORSOptions{AllowedOrigins: []string{"app.example"}}),
		WithCORS(CORSOptions{AllowedOrigins: []string{"*"}}),
		WithCORS(CORSOptions{AllowAllOrigins: true, AllowCredentials: true}),
		WithCORS(CORSOptions{AllowAllOrigins: true, AllowedOrigins: []string{"https://app.example"}}),
		WithCORS(CORSOptions{AllowAllHeaders: true, AllowedHeaders: []string{"Authorization"}}),
		WithCORS(CORSOptions{AllowedHeaders: []string{" "}}),
		WithCORS(CORSOptions{MaxAge: -time.Second}),
	}

	for _, option := range tests {
		_, err := applyOptions([]Option{option})
		require.Error(t, err)
	}
}

func TestWithCORSNormalizesAndCopiesConfiguration(t *testing.T) {
	origins := []string{" https://App.Example "}
	headers := []string{" Content-Type "}
	option := WithCORS(CORSOptions{
		AllowedOrigins: origins,
		AllowedHeaders: headers,
	})
	origins[0] = "https://changed.example"
	headers[0] = "X-Changed"

	cfg, err := applyOptions([]Option{option})
	require.NoError(t, err)
	require.Equal(t, []string{"https://app.example"}, cfg.cors.AllowedOrigins)
	require.Equal(t, []string{"Content-Type"}, cfg.cors.AllowedHeaders)
}

func TestWithSchemaMatchHeadersCopiesConfiguration(t *testing.T) {
	headers := []string{" X-Tenant "}
	option := WithSchemaMatchHeaders(headers...)
	headers[0] = "X-Changed"

	cfg, err := applyOptions([]Option{option})
	require.NoError(t, err)
	require.Equal(t, []string{" X-Tenant "}, cfg.schemaMatchHeaders)
}
