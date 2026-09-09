package server

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
	"github.com/stretchr/testify/require"
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

func TestMatchesETag(t *testing.T) {
	tests := []struct {
		value        string
		strong, weak bool
	}{
		{"", false, false},
		{`"tag"`, true, true},
		{`W/"tag"`, false, true},
		{`"other,tag", W/"tag"`, false, true},
		{" , \t\"tag\" , ", true, true},
		{"*", true, true},
		{`"other"`, false, false},
		{"invalid", false, false},
		{`"unterminated`, false, false},
		{`"tag" "other"`, false, false},
		{`"tag", invalid`, false, false},
		{"\"bad\x7f\", \"tag\"", false, false},
		{`*, "tag"`, false, false},
		{`w/"tag"`, false, false},
	}
	for _, tt := range tests {
		require.Equal(t, tt.strong, matchesETag(tt.value, `"tag"`, false), "strong: %q", tt.value)
		require.Equal(t, tt.weak, matchesETag(tt.value, `"tag"`, true), "weak: %q", tt.value)
	}
}

func TestResponseETagIncludesFormat(t *testing.T) {
	response := commandResponse{contentType: commandResponses[CommandJSON].contentType, data: []byte(`[]`)}
	jsonETag := responseETag(response)
	response.contentType = commandResponses[CommandArrow].contentType
	require.NotEqual(t, jsonETag, responseETag(response))
}

func TestHTTPCachePreconditions(t *testing.T) {
	allowed := true
	var executions int
	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryJSON: func(context.Context, string, []string) (json.RawMessage, error) {
			executions++
			return json.RawMessage(`[]`), nil
		},
	}
	handler := mustHandler(t, spy, WithCacheControl("private, no-cache"), WithAuthorizer(AuthorizerFunc[struct{}](func(*http.Request) (CommandAuthorizer[struct{}], error) {
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
	etag := first.Header().Get("ETag")
	require.NotEmpty(t, etag)

	tests := []struct {
		name    string
		match   string
		none    []string
		allowed bool
		status  int
	}{
		{"strong match", etag, nil, true, http.StatusOK},
		{"weak match across lines", "*", []string{`"other"`, "W/" + etag}, true, http.StatusNotModified},
		{"if-match precedence", "W/" + etag, []string{etag}, true, http.StatusPreconditionFailed},
		{"authorization revoked", "", []string{etag}, false, http.StatusForbidden},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			allowed = tt.allowed
			req := httptest.NewRequest(http.MethodGet, "/?type=json&sql=SELECT+1", nil)
			req.Header.Set("If-Match", tt.match)
			req.Header["If-None-Match"] = tt.none
			res := httptest.NewRecorder()
			before := executions
			handler.ServeHTTP(res, req)
			require.Equal(t, tt.status, res.Code)
			if allowed {
				require.Equal(t, before+1, executions)
			} else {
				require.Equal(t, before, executions)
			}
			if tt.status >= http.StatusBadRequest {
				require.Empty(t, res.Header().Get("ETag"))
				require.Equal(t, "no-store", res.Header().Get("Cache-Control"))
			} else {
				require.Equal(t, etag, res.Header().Get("ETag"))
				require.Equal(t, "private, no-cache", res.Header().Get("Cache-Control"))
			}
		})
	}
}

func TestHTTPCacheNonQueryResponses(t *testing.T) {
	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		exec:               func(context.Context, string) error { return nil },
		queryJSON:          func(context.Context, string, []string) (json.RawMessage, error) { return json.RawMessage(`[]`), nil },
	}
	handler := mustHandler(t, spy, WithCacheControl("public, max-age=60"))
	tests := []struct {
		name    string
		method  string
		uri     string
		body    string
		headers http.Header
		status  int
	}{
		{name: "GET exec", method: http.MethodGet, uri: "/?type=exec&sql=SELECT+1", status: http.StatusOK},
		{name: "POST query", method: http.MethodPost, uri: "/", body: `{"type":"json","sql":"SELECT 1"}`, status: http.StatusOK},
		{name: "OPTIONS", method: http.MethodOptions, uri: "/", status: http.StatusOK},
		{name: "preflight", method: http.MethodOptions, uri: "/", headers: http.Header{"Origin": {"http://app.example"}, "Access-Control-Request-Method": {"GET"}}, status: http.StatusOK},
		{name: "origin denial", method: http.MethodGet, uri: "/?type=json&sql=SELECT+1", headers: http.Header{"Origin": {"http://untrusted.example"}}, status: http.StatusForbidden},
		{name: "HEAD", method: http.MethodHead, uri: "/?type=json&sql=SELECT+1", status: http.StatusMethodNotAllowed},
		{name: "missing SQL", method: http.MethodGet, uri: "/?type=json", status: http.StatusBadRequest},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.uri, strings.NewReader(tt.body))
			for name, values := range tt.headers {
				req.Header[name] = values
			}
			req.Header.Set("If-Match", `"other"`)
			req.Header.Set("If-None-Match", "*")
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, req)
			require.Equal(t, tt.status, res.Code)
			require.Equal(t, "no-store", res.Header().Get("Cache-Control"))
			require.Empty(t, res.Header().Get("ETag"))
		})
	}
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
	handler := mustHandler(t, spy, WithSchemaMatchHeaders("x-tenant-id"), WithVary("X-Region"), WithCacheControl("public, max-age=60"))
	get := func(tenant, etag string) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(http.MethodGet, "/?type=json&sql=SELECT+1", nil)
		req.Header.Set("X-Tenant-Id", tenant)
		req.Header.Set("If-None-Match", etag)
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, req)
		require.Contains(t, strings.Join(res.Header().Values("Vary"), ","), "X-Tenant-Id")
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
