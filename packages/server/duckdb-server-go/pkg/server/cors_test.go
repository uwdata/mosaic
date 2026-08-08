package server

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

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
