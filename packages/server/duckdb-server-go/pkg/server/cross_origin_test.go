package server

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCrossOriginProtection(t *testing.T) {
	tests := []struct {
		name       string
		options    CORSOptions
		origin     string
		fetchSite  string
		wantStatus int
		wantCalled bool
		wantOrigin string
	}{
		{
			name:       "non-browser request",
			wantStatus: http.StatusOK,
			wantCalled: true,
		},
		{
			name:       "same-origin browser request",
			origin:     "http://server.example",
			fetchSite:  "same-origin",
			wantStatus: http.StatusOK,
			wantCalled: true,
		},
		{
			name:       "cross-site request without origin",
			fetchSite:  "cross-site",
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "same host fallback behind TLS proxy",
			origin:     "https://server.example",
			wantStatus: http.StatusOK,
			wantCalled: true,
		},
		{
			name:       "cross-site request",
			origin:     "https://other.example",
			fetchSite:  "cross-site",
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "cross-site signal takes precedence over same host fallback",
			origin:     "https://server.example",
			fetchSite:  "cross-site",
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "configured trusted origin",
			options:    CORSOptions{AllowedOrigins: []string{"https://app.example"}},
			origin:     "https://app.example",
			fetchSite:  "cross-site",
			wantStatus: http.StatusOK,
			wantCalled: true,
			wantOrigin: "https://app.example",
		},
		{
			name:       "trusted origin patterns are not expanded",
			options:    CORSOptions{AllowedOrigins: []string{"https://*.example"}},
			origin:     "https://app.example",
			fetchSite:  "cross-site",
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "explicit allow all disables protection",
			options:    CORSOptions{AllowAllOrigins: true},
			origin:     "https://other.example",
			fetchSite:  "cross-site",
			wantStatus: http.StatusOK,
			wantCalled: true,
			wantOrigin: "*",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			called := false
			handler := newProtectedCORSHandler(t, tt.options, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				called = true
				w.WriteHeader(http.StatusOK)
			}))
			req := httptest.NewRequest(http.MethodPost, "http://server.example/", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}
			if tt.fetchSite != "" {
				req.Header.Set("Sec-Fetch-Site", tt.fetchSite)
			}
			res := httptest.NewRecorder()

			handler.ServeHTTP(res, req)

			require.Equal(t, tt.wantStatus, res.Code)
			require.Equal(t, tt.wantCalled, called)
			require.Equal(t, tt.wantOrigin, res.Header().Get("Access-Control-Allow-Origin"))
			if tt.wantStatus == http.StatusForbidden {
				vary := strings.Join(res.Header().Values("Vary"), ",")
				require.Contains(t, vary, "Origin")
				require.Contains(t, vary, "Sec-Fetch-Site")
			}
		})
	}
}

func TestCrossOriginGETExecRejectedBeforeAuthorizationAndExecution(t *testing.T) {
	var requestCalls atomic.Int32
	handler := mustHandler(t, failOnCallExecutor{t}, WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
		requestCalls.Add(1)
		return func(context.Context, Command) error { return nil }, nil
	})))
	values := make(url.Values)
	values.Set("type", string(CommandExec))
	values.Set("sql", "CREATE TABLE must_not_exist(value INTEGER)")
	req := httptest.NewRequest(http.MethodGet, "http://server.example/?"+values.Encode(), nil)
	req.Header.Set("Origin", "https://other.example")
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	res := httptest.NewRecorder()

	handler.ServeHTTP(res, req)

	require.Equal(t, http.StatusForbidden, res.Code)
	require.Zero(t, requestCalls.Load())
}

func newProtectedCORSHandler(t *testing.T, options CORSOptions, next http.Handler) http.Handler {
	t.Helper()
	cfg, err := applyOptions([]Option{WithCORS(options)})
	require.NoError(t, err)
	return newCORSHandler(cfg.cors, cfg.corsProtection, next)
}
