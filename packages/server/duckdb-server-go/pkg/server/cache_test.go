package server

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

func TestHTTPCacheRevalidation(t *testing.T) {
	for _, typ := range []CommandType{CommandJSON, CommandArrow} {
		t.Run(string(typ), func(t *testing.T) {
			db := setupTestDB(t)
			require.NoError(t, db.Exec(t.Context(), "CREATE TABLE cache_test AS SELECT 1 AS value"))
			handler, err := New(db, WithCacheControl("public, max-age=60"), WithVary("X-Dataset"))
			require.NoError(t, err)
			server := httptest.NewServer(handler)
			t.Cleanup(server.Close)
			uri := server.URL + "/?type=" + string(typ) + "&sql=" + url.QueryEscape("SELECT * FROM cache_test ORDER BY value")
			get := func(etag string) (*http.Response, []byte) {
				t.Helper()
				req, err := http.NewRequestWithContext(t.Context(), http.MethodGet, uri, nil)
				require.NoError(t, err)
				if etag != "" {
					req.Header.Set("If-None-Match", etag)
				}
				res, err := server.Client().Do(req)
				require.NoError(t, err)
				body, err := io.ReadAll(res.Body)
				require.NoError(t, res.Body.Close())
				require.NoError(t, err)
				return res, body
			}

			first, body := get("")
			require.Equal(t, http.StatusOK, first.StatusCode)
			require.NotEmpty(t, body)
			etag := first.Header.Get("ETag")
			require.Regexp(t, `^"[0-9a-f]{64}"$`, etag)
			require.Equal(t, commandResponses[typ].contentType, first.Header.Get("Content-Type"))

			revalidated, body := get(etag)
			require.Equal(t, http.StatusNotModified, revalidated.StatusCode)
			require.Empty(t, body)
			require.Empty(t, revalidated.Header.Get("Content-Type"))
			require.Empty(t, revalidated.Header.Get("Content-Length"))
			require.NotEmpty(t, revalidated.Header.Get("Date"))
			for _, header := range []string{"Cache-Control", "ETag", "Vary"} {
				require.Equal(t, first.Header.Values(header), revalidated.Header.Values(header))
			}

			require.NoError(t, db.Exec(t.Context(), "INSERT INTO cache_test VALUES (2)"))
			changed, body := get(etag)
			require.Equal(t, http.StatusOK, changed.StatusCode)
			require.NotEmpty(t, body)
			require.NotEqual(t, etag, changed.Header.Get("ETag"))
		})
	}
}

func TestHTTPCachePreconditions(t *testing.T) {
	var calls int
	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryJSON: func(context.Context, string, []string) (json.RawMessage, error) {
			calls++
			return json.RawMessage(`[]`), nil
		},
		queryArrow: func(context.Context, string, []string) ([]byte, error) {
			calls++
			return []byte(`[]`), nil
		},
	}
	handler := mustHandler(t, spy, WithCacheControl("private, no-cache"))
	first := httptest.NewRecorder()
	handler.ServeHTTP(first, httptest.NewRequest(http.MethodGet, "/?type=json&sql=SELECT+1", nil))
	etag := first.Header().Get("ETag")
	require.NotEmpty(t, etag)

	tests := []struct {
		name   string
		none   []string
		match  string
		status int
	}{
		{name: "absent", status: http.StatusOK},
		{name: "exact", none: []string{"$etag"}, status: http.StatusNotModified},
		{name: "weak", none: []string{"W/$etag"}, status: http.StatusNotModified},
		{name: "list", none: []string{`"other,tag", W/$etag`}, status: http.StatusNotModified},
		{name: "multiple lines", none: []string{`"other"`, "$etag"}, status: http.StatusNotModified},
		{name: "whitespace and empty elements", none: []string{" , \t$etag , "}, status: http.StatusNotModified},
		{name: "wildcard", none: []string{"*"}, status: http.StatusNotModified},
		{name: "different", none: []string{`"other"`}, status: http.StatusOK},
		{name: "unquoted", none: []string{"invalid"}, status: http.StatusOK},
		{name: "unterminated", none: []string{`"unterminated`}, status: http.StatusOK},
		{name: "missing separator", none: []string{`$etag "other"`}, status: http.StatusOK},
		{name: "invalid suffix", none: []string{"$etag, invalid"}, status: http.StatusOK},
		{name: "control character", none: []string{"\"bad\x7f\", $etag"}, status: http.StatusOK},
		{name: "wildcard in list", none: []string{"*, $etag"}, status: http.StatusOK},
		{name: "lowercase weakness", none: []string{"w/$etag"}, status: http.StatusOK},
		{name: "if-match exact", match: "$etag", status: http.StatusOK},
		{name: "if-match wildcard", match: "*", status: http.StatusOK},
		{name: "if-match weak", match: "W/$etag", status: http.StatusPreconditionFailed},
		{name: "if-match precedence", match: `"other"`, none: []string{"$etag"}, status: http.StatusPreconditionFailed},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/?type=json&sql=SELECT+1", nil)
			for _, value := range tt.none {
				req.Header.Add("If-None-Match", strings.ReplaceAll(value, "$etag", etag))
			}
			req.Header.Set("If-Match", strings.ReplaceAll(tt.match, "$etag", etag))
			res := httptest.NewRecorder()
			before := calls
			handler.ServeHTTP(res, req)
			require.Equal(t, before+1, calls)
			require.Equal(t, tt.status, res.Code)
			if tt.status == http.StatusPreconditionFailed {
				require.Empty(t, res.Header().Get("ETag"))
				require.Equal(t, "no-store", res.Header().Get("Cache-Control"))
			} else {
				require.Equal(t, etag, res.Header().Get("ETag"))
				require.Equal(t, "private, no-cache", res.Header().Get("Cache-Control"))
			}
			if tt.status == http.StatusNotModified {
				require.Empty(t, res.Body.Bytes())
			}
		})
	}

	req := httptest.NewRequest(http.MethodGet, "/?type=arrow&sql=SELECT+1", nil)
	req.Header.Set("If-None-Match", etag)
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	require.Equal(t, http.StatusOK, res.Code)
	require.NotEqual(t, etag, res.Header().Get("ETag"))
}

func TestHTTPCacheAuthorizationOnRevalidation(t *testing.T) {
	allowed := true
	var executions int
	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryJSON: func(context.Context, string, []string) (json.RawMessage, error) {
			executions++
			return json.RawMessage(`[]`), nil
		},
	}
	handler := mustHandler(t, spy, WithCacheControl("private, max-age=60"), WithAuthorizer(AuthorizerFunc[struct{}](func(*http.Request) (CommandAuthorizer[struct{}], error) {
		return func(context.Context, Command[struct{}]) error {
			if !allowed {
				return ErrPermissionDenied
			}
			return nil
		}, nil
	})))
	first := httptest.NewRecorder()
	handler.ServeHTTP(first, httptest.NewRequest(http.MethodGet, "/?type=json&sql=SELECT+1", nil))
	require.Equal(t, http.StatusOK, first.Code)

	allowed = false
	req := httptest.NewRequest(http.MethodGet, "/?type=json&sql=SELECT+1", nil)
	req.Header.Set("If-None-Match", first.Header().Get("ETag"))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	require.Equal(t, http.StatusForbidden, res.Code)
	require.Equal(t, 1, executions)
	require.Equal(t, "no-store", res.Header().Get("Cache-Control"))
	require.Empty(t, res.Header().Get("ETag"))
}

func TestHTTPCacheNonQueryResponses(t *testing.T) {
	tests := []struct {
		name     string
		method   string
		uri      string
		body     string
		options  []Option
		headers  http.Header
		queryErr error
		status   int
	}{
		{name: "GET exec", method: http.MethodGet, uri: "/?type=exec&sql=SELECT+1", status: http.StatusOK},
		{name: "POST query", method: http.MethodPost, uri: "/", body: `{"type":"json","sql":"SELECT 1"}`, status: http.StatusOK},
		{name: "OPTIONS", method: http.MethodOptions, uri: "/", status: http.StatusOK},
		{name: "preflight", method: http.MethodOptions, uri: "/", headers: http.Header{"Origin": {"http://app.example"}, "Access-Control-Request-Method": {"GET"}}, status: http.StatusOK},
		{name: "invalid method", method: http.MethodPut, uri: "/", status: http.StatusMethodNotAllowed},
		{name: "HEAD", method: http.MethodHead, uri: "/?type=json&sql=SELECT+1", status: http.StatusMethodNotAllowed},
		{name: "missing SQL", method: http.MethodGet, uri: "/?type=json", status: http.StatusBadRequest},
		{name: "invalid type", method: http.MethodGet, uri: "/?type=invalid&sql=SELECT+1", status: http.StatusBadRequest},
		{name: "invalid JSON", method: http.MethodPost, uri: "/", body: "{", status: http.StatusBadRequest},
		{name: "body limit", method: http.MethodPost, uri: "/", body: `{"type":"json"}`, options: []Option{WithMaxMessageBytes(1)}, status: http.StatusRequestEntityTooLarge},
		{name: "missing schema", method: http.MethodGet, uri: "/?type=json&sql=SELECT+1", options: []Option{WithSchemaMatchHeaders("X-Tenant")}, status: http.StatusUnauthorized},
		{name: "query policy denial", method: http.MethodGet, uri: "/?type=json&sql=SELECT+1", queryErr: query.ErrAccessDenied, status: http.StatusForbidden},
		{name: "unsupported query", method: http.MethodGet, uri: "/?type=json&sql=SELECT+1", queryErr: query.ErrUnsupportedStatement, status: http.StatusBadRequest},
		{name: "query failure", method: http.MethodGet, uri: "/?type=json&sql=SELECT+1", queryErr: errors.New("query failed"), status: http.StatusInternalServerError},
		{name: "origin denial", method: http.MethodGet, uri: "/?type=json&sql=SELECT+1", headers: http.Header{"Origin": {"http://untrusted.example"}}, status: http.StatusForbidden},
		{name: "websocket origin denial", method: http.MethodGet, uri: "/", headers: http.Header{"Connection": {"upgrade"}, "Upgrade": {"websocket"}, "Origin": {"http://untrusted.example"}}, status: http.StatusForbidden},
		{name: "request denial", method: http.MethodGet, uri: "/?type=json&sql=SELECT+1", options: []Option{WithAuthorizer(AuthorizerFunc[struct{}](func(*http.Request) (CommandAuthorizer[struct{}], error) {
			return nil, ErrUnauthenticated
		}))}, status: http.StatusUnauthorized},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			spy := &spyCommandExecutor{failOnCallExecutor: failOnCallExecutor{t}}
			if tt.name == "GET exec" {
				spy.exec = func(context.Context, string) error { return nil }
			}
			if tt.name == "POST query" || tt.queryErr != nil {
				spy.queryJSON = func(context.Context, string, []string) (json.RawMessage, error) {
					return json.RawMessage(`[]`), tt.queryErr
				}
			}
			options := append([]Option{WithCacheControl("public, max-age=60")}, tt.options...)
			handler := mustHandler(t, spy, options...)
			req := httptest.NewRequest(tt.method, tt.uri, strings.NewReader(tt.body))
			for name, values := range tt.headers {
				req.Header[name] = values
			}
			req.Header.Set("If-None-Match", "*")
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, req)
			require.Equal(t, tt.status, res.Code)
			require.Equal(t, "no-store", res.Header().Get("Cache-Control"))
			require.Empty(t, res.Header().Get("ETag"))
		})
	}
}

func TestVaryIndependentOfCacheControl(t *testing.T) {
	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryJSON:          func(context.Context, string, []string) (json.RawMessage, error) { return json.RawMessage(`[]`), nil },
	}
	for _, policy := range []string{"", "public, max-age=60"} {
		t.Run(policy, func(t *testing.T) {
			handler := mustHandler(t, spy, WithCacheControl(policy), WithVary("X-Dataset"), WithCORS(CORSOptions{AllowedOrigins: []string{"http://app.example"}}))
			for _, conditional := range []bool{false, true} {
				req := httptest.NewRequest(http.MethodGet, "/?type=json&sql=SELECT+1", nil)
				req.Header.Set("Origin", "http://app.example")
				if conditional {
					req.Header.Set("If-None-Match", "*")
				}
				res := httptest.NewRecorder()
				res.Header().Set("Cache-Control", "private, max-age=300")
				res.Header().Add("Vary", "Accept-Encoding")
				handler.ServeHTTP(res, req)
				wantStatus := http.StatusOK
				if conditional && policy != "" {
					wantStatus = http.StatusNotModified
				}
				require.Equal(t, wantStatus, res.Code)
				if policy == "" {
					require.Equal(t, "private, max-age=300", res.Header().Get("Cache-Control"))
					require.Empty(t, res.Header().Get("ETag"))
				}
				vary := strings.Join(res.Header().Values("Vary"), ",")
				for _, name := range []string{"X-Dataset", "Accept-Encoding", "Origin", "Sec-Fetch-Site"} {
					require.Contains(t, vary, name)
				}
				require.Equal(t, "http://app.example", res.Header().Get("Access-Control-Allow-Origin"))
			}
		})
	}
}

func TestHTTPCacheSchemaMatchVariation(t *testing.T) {
	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryJSON: func(_ context.Context, _ string, schemas []string) (json.RawMessage, error) {
			return json.Marshal(schemas)
		},
	}
	handler := mustHandler(t, spy, WithSchemaMatchHeaders("x-tenant-id"), WithCacheControl("public, max-age=60"))
	get := func(tenant, etag string) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(http.MethodGet, "/?type=json&sql=SELECT+1", nil)
		req.Header.Set("X-Tenant-Id", tenant)
		req.Header.Set("If-None-Match", etag)
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, req)
		require.Contains(t, res.Header().Values("Vary"), "X-Tenant-Id")
		return res
	}

	var previousETag string
	for _, tenant := range []string{"alpha", "beta"} {
		res := get(tenant, previousETag)
		require.Equal(t, http.StatusOK, res.Code)
		require.JSONEq(t, `["`+tenant+`"]`, res.Body.String())
		require.Equal(t, "public, max-age=60", res.Header().Get("Cache-Control"))
		etag := res.Header().Get("ETag")
		require.NotEmpty(t, etag)
		require.NotEqual(t, previousETag, etag)
		revalidated := get(tenant, etag)
		require.Equal(t, http.StatusNotModified, revalidated.Code)
		require.Empty(t, revalidated.Body.Bytes())
		require.Equal(t, res.Header().Values("Vary"), revalidated.Header().Values("Vary"))
		previousETag = etag
	}
	denied := get("", previousETag)
	require.Equal(t, http.StatusUnauthorized, denied.Code)
	require.Equal(t, "no-store", denied.Header().Get("Cache-Control"))
	require.Empty(t, denied.Header().Get("ETag"))
}

func TestHTTPCacheWebSocket(t *testing.T) {
	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryJSON:          func(context.Context, string, []string) (json.RawMessage, error) { return json.RawMessage(`[]`), nil },
	}
	server := newWebSocketTestServer(t, mustHandler(t, spy, WithCacheControl("public, max-age=60"), WithVary("X-Dataset")))
	conn, res, err := server.dial(&websocket.DialOptions{HTTPHeader: http.Header{"If-None-Match": {"*"}}})
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, conn.CloseNow()) })
	require.Equal(t, http.StatusSwitchingProtocols, res.StatusCode)
	require.Equal(t, "no-store", res.Header.Get("Cache-Control"))
	require.Empty(t, res.Header.Get("ETag"))
	require.Contains(t, strings.Join(res.Header.Values("Vary"), ","), "X-Dataset")
	require.NoError(t, wsjson.Write(server.ctx, conn, map[string]string{"type": "json", "sql": "SELECT 1"}))
	var result json.RawMessage
	require.NoError(t, wsjson.Read(server.ctx, conn, &result))
	require.JSONEq(t, `[]`, string(result))
}
