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

func TestWithMaxMessageBytesRejectsNonpositiveLimits(t *testing.T) {
	for _, limit := range []int64{-1, 0} {
		_, err := applyOptions([]Option{WithMaxMessageBytes(limit)})
		require.ErrorContains(t, err, "must be positive")
	}
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

func TestWithWebSocketRejectsInvalidConfiguration(t *testing.T) {
	tests := []Option{
		WithWebSocket(WebSocketOptions{AllowedOrigins: []string{"["}}),
		WithWebSocket(WebSocketOptions{AllowedOrigins: []string{"*"}}),
		WithWebSocket(WebSocketOptions{AllowedOrigins: []string{" "}}),
		WithWebSocket(WebSocketOptions{
			AllowedOrigins:  []string{"app.example"},
			AllowAllOrigins: true,
		}),
	}

	for _, option := range tests {
		_, err := applyOptions([]Option{option})
		require.Error(t, err)
	}
}

func TestWithWebSocketCopiesConfiguration(t *testing.T) {
	origins := []string{" *.Example "}
	option := WithWebSocket(WebSocketOptions{AllowedOrigins: origins})
	origins[0] = "changed.example"

	cfg, err := applyOptions([]Option{option})
	require.NoError(t, err)
	require.Equal(t, []string{"*.Example"}, cfg.websocket.AllowedOrigins)
}

func TestWithSchemaMatchHeadersCopiesConfiguration(t *testing.T) {
	headers := []string{" X-Tenant "}
	option := WithSchemaMatchHeaders(headers...)
	headers[0] = "X-Changed"

	cfg, err := applyOptions([]Option{option})
	require.NoError(t, err)
	require.Equal(t, []string{" X-Tenant "}, cfg.schemaMatchHeaders)
}

func TestWithCacheControl(t *testing.T) {
	for _, value := range []string{"public\r\nX-Injected: true", "private\x00", "no-cache\x7f"} {
		_, err := applyOptions([]Option{WithCacheControl(value)})
		require.Error(t, err)
	}
	cfg, err := applyOptions([]Option{WithCacheControl(` private, max-age=60, custom="value" `)})
	require.NoError(t, err)
	require.Equal(t, `private, max-age=60, custom="value"`, cfg.cacheControl)
	cfg, err = applyOptions([]Option{WithCacheControl("public"), WithCacheControl("")})
	require.NoError(t, err)
	require.Empty(t, cfg.cacheControl)
}

func TestWithVary(t *testing.T) {
	for _, value := range []string{"", " ", "X-Tenant,Origin", "X:Tenant", "X Tenant", "X-\r\nInjected", "X-\x00", "X-\x7f", "X-ü"} {
		_, err := applyOptions([]Option{WithVary(value)})
		require.Error(t, err)
	}
	headers := []string{" x-tenant ", "origin", "X-TENANT"}
	option := WithVary(headers...)
	headers[0] = "X-Changed"
	cfg, err := applyOptions([]Option{option})
	require.NoError(t, err)
	require.Equal(t, []string{"X-Tenant", "Origin"}, cfg.varyHeaders)
	cfg.varyHeaders[0] = "X-Changed-Again"
	cfg, err = applyOptions([]Option{option})
	require.NoError(t, err)
	require.Equal(t, []string{"X-Tenant", "Origin"}, cfg.varyHeaders)
	cfg, err = applyOptions([]Option{WithVary("*")})
	require.NoError(t, err)
	require.Equal(t, []string{"*"}, cfg.varyHeaders)
	cfg, err = applyOptions([]Option{option, WithVary()})
	require.NoError(t, err)
	require.Empty(t, cfg.varyHeaders)
}
