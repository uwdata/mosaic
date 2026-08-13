package server

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/coder/websocket"
	"github.com/stretchr/testify/require"
)

func TestCORSActualRequestNegotiation(t *testing.T) {
	tests := []struct {
		name       string
		options    CORSOptions
		origin     string
		wantOrigin string
	}{
		{name: "no origin"},
		{
			name:       "exact origin",
			options:    CORSOptions{AllowedOrigins: []string{"https://app.example"}},
			origin:     "https://app.example",
			wantOrigin: "https://app.example",
		},
		{
			name:    "disallowed origin still reaches application",
			options: CORSOptions{AllowedOrigins: []string{"https://app.example"}},
			origin:  "https://other.example",
		},
		{
			name:       "allow all",
			options:    CORSOptions{AllowAllOrigins: true},
			origin:     "https://other.example",
			wantOrigin: "*",
		},
		{
			name:    "origin patterns are not expanded",
			options: CORSOptions{AllowedOrigins: []string{"https://*.example"}},
			origin:  "https://app.example",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			called := false
			handler := newTestCORSHandler(t, tt.options, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				called = true
				w.WriteHeader(http.StatusOK)
			}))
			req := httptest.NewRequest(http.MethodPost, "/", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}
			res := httptest.NewRecorder()

			handler.ServeHTTP(res, req)

			require.Equal(t, http.StatusOK, res.Code)
			require.True(t, called)
			require.Equal(t, tt.wantOrigin, res.Header().Get("Access-Control-Allow-Origin"))
		})
	}
}

func TestCORSPreflight(t *testing.T) {
	t.Run("default JSON headers", func(t *testing.T) {
		called := false
		handler := newTestCORSHandler(t, CORSOptions{
			AllowedOrigins: []string{"https://app.example"},
		}, http.HandlerFunc(func(http.ResponseWriter, *http.Request) { called = true }))
		req := newPreflight("https://app.example", http.MethodPost, "content-type")
		res := httptest.NewRecorder()

		handler.ServeHTTP(res, req)

		require.Equal(t, http.StatusOK, res.Code)
		require.False(t, called)
		require.Equal(t, "https://app.example", res.Header().Get("Access-Control-Allow-Origin"))
		require.Equal(t, http.MethodPost, res.Header().Get("Access-Control-Allow-Methods"))
		require.True(t, strings.EqualFold("Content-Type", res.Header().Get("Access-Control-Allow-Headers")))
	})

	t.Run("configured credentials headers and max age", func(t *testing.T) {
		handler := newTestCORSHandler(t, CORSOptions{
			AllowedOrigins:   []string{"https://app.example"},
			AllowedHeaders:   []string{"Authorization"},
			AllowCredentials: true,
			MaxAge:           time.Minute,
		}, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
			t.Fatal("preflight reached application")
		}))
		res := httptest.NewRecorder()

		handler.ServeHTTP(res, newPreflight("https://app.example", http.MethodGet, "authorization"))

		require.Equal(t, http.StatusOK, res.Code)
		require.Equal(t, "true", res.Header().Get("Access-Control-Allow-Credentials"))
		require.Equal(t, "60", res.Header().Get("Access-Control-Max-Age"))
	})

	for _, tt := range []struct {
		name   string
		origin string
		header string
	}{
		{name: "disallowed origin", origin: "https://other.example", header: "content-type"},
		{name: "disallowed header", origin: "https://app.example", header: "x-forbidden"},
	} {
		t.Run(tt.name, func(t *testing.T) {
			handler := newTestCORSHandler(t, CORSOptions{
				AllowedOrigins: []string{"https://app.example"},
			}, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
				t.Fatal("preflight reached application")
			}))
			res := httptest.NewRecorder()

			handler.ServeHTTP(res, newPreflight(tt.origin, http.MethodPost, tt.header))

			require.Equal(t, http.StatusOK, res.Code)
			require.Empty(t, res.Header().Get("Access-Control-Allow-Origin"))
		})
	}

	t.Run("plain OPTIONS preserves legacy status", func(t *testing.T) {
		called := false
		handler := newTestCORSHandler(t, CORSOptions{}, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
			called = true
		}))
		res := httptest.NewRecorder()

		handler.ServeHTTP(res, httptest.NewRequest(http.MethodOptions, "/", nil))

		require.Equal(t, http.StatusOK, res.Code)
		require.False(t, called)
	})
}

func TestCORSPreflightBypassesAuthorization(t *testing.T) {
	var requestCalls atomic.Int32
	handler := mustHandler(t, failOnCallExecutor{t},
		WithCORS(CORSOptions{AllowedOrigins: []string{"https://app.example"}}),
		WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
			requestCalls.Add(1)
			return func(context.Context, Command) error { return nil }, nil
		})),
	)
	res := httptest.NewRecorder()

	handler.ServeHTTP(res, newPreflight("https://app.example", http.MethodPost, "content-type"))

	require.Equal(t, http.StatusOK, res.Code)
	require.Zero(t, requestCalls.Load())
}

func TestCORSPreservesExistingVaryValues(t *testing.T) {
	inner := newTestCORSHandler(t, CORSOptions{}, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Vary", "Accept-Encoding")
		inner.ServeHTTP(w, r)
	})
	res := httptest.NewRecorder()

	handler.ServeHTTP(res, newPreflight("https://app.example", http.MethodPost, "content-type"))

	vary := strings.Join(res.Header().Values("Vary"), ",")
	require.Contains(t, vary, "Accept-Encoding")
	require.Contains(t, vary, "Origin")
	require.Contains(t, vary, "Access-Control-Request-Method")
	require.Contains(t, vary, "Access-Control-Request-Headers")
}

func newTestCORSHandler(t *testing.T, options CORSOptions, next http.Handler) http.Handler {
	t.Helper()
	cfg, err := applyOptions([]Option{WithCORS(options)})
	require.NoError(t, err)
	return newCORSHandler(cfg.cors, nil, next)
}

func newPreflight(origin, method, headers string) *http.Request {
	req := httptest.NewRequest(http.MethodOptions, "/", nil)
	req.Header.Set("Origin", origin)
	req.Header.Set("Access-Control-Request-Method", method)
	if headers != "" {
		req.Header.Set("Access-Control-Request-Headers", headers)
	}
	return req
}

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

func TestWebSocketOriginPolicyPrecedesAuthorization(t *testing.T) {
	tests := []struct {
		name             string
		options          WebSocketOptions
		origin           func(string) string
		wantAllowed      bool
		wantRequestCalls int32
	}{
		{
			name:             "no origin",
			wantAllowed:      true,
			wantRequestCalls: 1,
		},
		{
			name:             "same host",
			origin:           func(serverURL string) string { return serverURL },
			wantAllowed:      true,
			wantRequestCalls: 1,
		},
		{
			name:             "allowed host pattern",
			options:          WebSocketOptions{AllowedOrigins: []string{"*.example"}},
			origin:           func(string) string { return "https://APP.example" },
			wantAllowed:      true,
			wantRequestCalls: 1,
		},
		{
			name:             "allowed scheme pattern",
			options:          WebSocketOptions{AllowedOrigins: []string{"https://*.example"}},
			origin:           func(string) string { return "https://app.example" },
			wantAllowed:      true,
			wantRequestCalls: 1,
		},
		{
			name:             "allow all",
			options:          WebSocketOptions{AllowAllOrigins: true},
			origin:           func(string) string { return "https://other.example" },
			wantAllowed:      true,
			wantRequestCalls: 1,
		},
		{
			name:        "disallowed origin",
			origin:      func(string) string { return "https://other.example" },
			wantAllowed: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var requestCalls atomic.Int32
			handler := mustHandler(t, failOnCallExecutor{t},
				WithWebSocket(tt.options),
				WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
					requestCalls.Add(1)
					return func(context.Context, Command) error { return nil }, nil
				})),
			)
			server := newWebSocketTestServer(t, handler)

			header := make(http.Header)
			if tt.origin != nil {
				header.Set("Origin", tt.origin(server.httpURL))
			}
			conn, res, err := server.dial(&websocket.DialOptions{HTTPHeader: header})
			if tt.wantAllowed {
				require.NoError(t, err)
				require.NotNil(t, conn)
				require.NotNil(t, res)
				require.Equal(t, http.StatusSwitchingProtocols, res.StatusCode)
				require.NoError(t, conn.Close(websocket.StatusNormalClosure, ""))
			} else {
				require.Error(t, err)
				require.Nil(t, conn)
				require.NotNil(t, res)
				require.Equal(t, http.StatusForbidden, res.StatusCode)
				_, readErr := io.Copy(io.Discard, res.Body)
				require.NoError(t, readErr)
				require.NoError(t, res.Body.Close())
			}
			require.Equal(t, tt.wantRequestCalls, requestCalls.Load())
		})
	}
}
