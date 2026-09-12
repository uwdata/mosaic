package server

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

type preaggregateScopeKey struct{}

func setupPreaggregateHandler(t *testing.T, limits query.PreAggregateLimits, opts ...Option) (http.Handler, *query.DB) {
	t.Helper()
	db := setupTestDB(t)
	require.NoError(t, db.Exec(t.Context(), `CREATE SCHEMA tenant;
CREATE TABLE tenant.source AS SELECT * FROM (VALUES ('a'), ('b'), ('b')) t(dim)`))
	opts = append(opts, WithPreaggregation(PreAggregateOptions{
		Limits: limits,
		Scope: func(ctx context.Context) (query.PreAggregateScope, error) {
			scope, ok := ctx.Value(preaggregateScopeKey{}).(query.PreAggregateScope)
			if !ok {
				return query.PreAggregateScope{}, ErrUnauthenticated
			}
			return scope, nil
		},
	}))
	h, err := New(db, opts...)
	require.NoError(t, err)
	return h, db
}

func preaggregateRequest(t *testing.T, h http.Handler, method string, scope query.PreAggregateScope, payload map[string]any) *httptest.ResponseRecorder {
	t.Helper()
	body, err := json.Marshal(payload)
	require.NoError(t, err)
	target := "/"
	if method == http.MethodGet {
		target += "?type=" + url.QueryEscape(payload["type"].(string)) + "&sql=" + url.QueryEscape(payload["sql"].(string))
	}
	req := httptest.NewRequest(method, target, strings.NewReader(string(body)))
	req = req.WithContext(context.WithValue(req.Context(), preaggregateScopeKey{}, scope))
	response := httptest.NewRecorder()
	h.ServeHTTP(response, req)
	return response
}

func TestHTTPPreaggregate(t *testing.T) {
	h, db := setupPreaggregateHandler(t, query.PreAggregateLimits{})
	scope := query.PreAggregateScope{Key: "tenant:reader", Sources: []query.PreAggregateNamespace{{Catalog: "memory", Schema: "tenant"}}}
	source := `SELECT dim, count(*) AS n FROM memory.tenant.source GROUP BY dim`
	payload := map[string]any{"type": "preagg", "sql": source, "catalog": "caller", "schema": "caller", "table": "caller", "application": map[string]any{"id": 42}}
	response := preaggregateRequest(t, h, http.MethodPost, scope, payload)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, "application/json", response.Header().Get("Content-Type"))
	require.Equal(t, "no-store", response.Header().Get("Cache-Control"))
	var table query.PreaggResponse
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &table))
	require.Equal(t, "memory", table.Catalog)
	require.NotEqual(t, "caller", table.Table)
	require.False(t, table.CreatedAt.IsZero())

	again := preaggregateRequest(t, h, http.MethodPost, scope, payload)
	require.JSONEq(t, response.Body.String(), again.Body.String())
	ref := `"` + table.Catalog + `"."` + table.Schema + `"."` + table.Table + `"`
	read := map[string]any{"type": "arrow", "sql": "SELECT * FROM " + ref + " ORDER BY dim"}
	response = preaggregateRequest(t, h, http.MethodPost, scope, read)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, []map[string]any{{"dim": "a", "n": float64(1)}, {"dim": "b", "n": float64(2)}}, arrowRows(t, response.Body.Bytes()))
	response = preaggregateRequest(t, h, http.MethodGet, scope, read)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, "no-store", response.Header().Get("Cache-Control"))
	require.Empty(t, response.Header().Get("ETag"))

	require.NoError(t, db.Exec(t.Context(), "DROP TABLE "+ref))
	response = preaggregateRequest(t, h, http.MethodPost, scope, read)
	require.Equal(t, http.StatusNotFound, response.Code)
	var failure map[string]string
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &failure))
	require.Equal(t, map[string]string{"error": "Not Found", "code": "table_not_found", "catalog": table.Catalog, "schema": table.Schema, "table": table.Table}, failure)
	response = preaggregateRequest(t, h, http.MethodPost, scope, payload)
	require.Equal(t, http.StatusOK, response.Code)
	response = preaggregateRequest(t, h, http.MethodPost, scope, read)
	require.Equal(t, http.StatusOK, response.Code)
}

func TestHTTPPreaggregateAuthorization(t *testing.T) {
	var revoked bool
	var sources []string
	authorizer := AuthorizerFunc[struct{}](func(*http.Request) (CommandAuthorizer[struct{}], error) {
		return func(_ context.Context, command Command[struct{}]) error {
			if command.Type() == CommandPreagg {
				sources = append(sources, command.SQL())
				if revoked {
					return ErrPermissionDenied
				}
			}
			return nil
		}, nil
	})
	h, _ := setupPreaggregateHandler(t, query.PreAggregateLimits{}, WithAuthorizer(authorizer))
	scope := query.PreAggregateScope{Key: "tenant:reader", Sources: []query.PreAggregateNamespace{{Catalog: "memory", Schema: "tenant"}}}
	source := `SELECT * FROM memory.tenant.source`
	payload := map[string]any{"type": "preagg", "sql": source}
	response := preaggregateRequest(t, h, http.MethodPost, scope, payload)
	require.Equal(t, http.StatusOK, response.Code)
	var table query.PreaggResponse
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &table))
	read := map[string]any{"type": "arrow", "sql": `SELECT * FROM "` + table.Catalog + `"."` + table.Schema + `"."` + table.Table + `"`}
	response = preaggregateRequest(t, h, http.MethodPost, scope, read)
	require.Equal(t, http.StatusOK, response.Code)
	require.Equal(t, []string{source, source}, sources)

	other := scope
	other.Key = "other"
	response = preaggregateRequest(t, h, http.MethodPost, other, read)
	require.Equal(t, http.StatusForbidden, response.Code)
	require.JSONEq(t, `{"error":"Forbidden","code":"forbidden"}`, response.Body.String())
	revoked = true
	for _, command := range []map[string]any{payload, read} {
		response = preaggregateRequest(t, h, http.MethodPost, scope, command)
		require.Equal(t, http.StatusForbidden, response.Code)
	}
}

func TestHTTPPreaggregateErrors(t *testing.T) {
	h, _ := setupPreaggregateHandler(t, query.PreAggregateLimits{MaxRows: 2})
	scope := query.PreAggregateScope{Key: "tenant:reader", Sources: []query.PreAggregateNamespace{{Catalog: "memory", Schema: "tenant"}}}
	for _, test := range []struct {
		method string
		typ    string
		sql    string
		status int
		code   string
	}{
		{http.MethodGet, "preagg", "SELECT 1", 400, "bad_request"},
		{http.MethodPost, "preagg", "SELECT 1; SELECT 2", 400, "bad_request"},
		{http.MethodPost, "exec", "CREATE TABLE injected AS SELECT 1", 400, "bad_request"},
		{http.MethodPost, "preagg", "SELECT * FROM memory.tenant.source", 429, "resource_exhausted"},
		{http.MethodPost, "preagg", "SELECT * FROM private.source", 403, "forbidden"},
	} {
		t.Run(test.sql+test.method, func(t *testing.T) {
			response := preaggregateRequest(t, h, test.method, scope, map[string]any{"type": test.typ, "sql": test.sql})
			require.Equal(t, test.status, response.Code, response.Body.String())
			var failure map[string]string
			require.NoError(t, json.Unmarshal(response.Body.Bytes(), &failure))
			require.Equal(t, test.code, failure["code"])
			require.NotContains(t, failure, "table")
		})
	}

	response := preaggregateRequest(t, h, http.MethodPost, query.PreAggregateScope{}, map[string]any{"type": "preagg", "sql": "SELECT 1"})
	require.Equal(t, http.StatusInternalServerError, response.Code)
	require.JSONEq(t, `{"error":"Internal Server Error","code":"internal_error"}`, response.Body.String())
}

func TestHTTPPreaggregatePayload(t *testing.T) {
	var sources []string
	authorizer := AuthorizerFunc[*applicationPayload](func(*http.Request) (CommandAuthorizer[*applicationPayload], error) {
		return func(_ context.Context, command Command[*applicationPayload]) error {
			if command.Type() == CommandPreagg {
				fields := command.Payload()
				if fields == nil || fields.ProjectID != 42 {
					return ErrPermissionDenied
				}
				sources = append(sources, command.SQL())
			}
			command.Payload().ProjectID = 0
			return nil
		}, nil
	})
	h, _ := setupPreaggregateHandler(t, query.PreAggregateLimits{}, WithAuthorizer(authorizer))
	scope := query.PreAggregateScope{Key: "project:42"}
	source := `SELECT 42 AS x`
	response := preaggregateRequest(t, h, http.MethodPost, scope, map[string]any{"type": "preagg", "sql": source, "projectId": 42})
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	var table query.PreaggResponse
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &table))
	read := map[string]any{"type": "arrow", "sql": `SELECT * FROM "` + table.Catalog + `"."` + table.Schema + `"."` + table.Table + `"`, "projectId": 42}
	response = preaggregateRequest(t, h, http.MethodPost, scope, read)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, []string{source, source}, sources)
	read["projectId"] = 43
	response = preaggregateRequest(t, h, http.MethodPost, scope, read)
	require.Equal(t, http.StatusForbidden, response.Code)
}

func TestHTTPPreaggregateNoStore(t *testing.T) {
	var revoked bool
	var calls int
	authorizer := AuthorizerFunc[struct{}](func(*http.Request) (CommandAuthorizer[struct{}], error) {
		return func(context.Context, Command[struct{}]) error {
			calls++
			if revoked {
				return ErrPermissionDenied
			}
			return nil
		}, nil
	})
	h, _ := setupPreaggregateHandler(t, query.PreAggregateLimits{}, WithCacheControl("public, max-age=60"), WithAuthorizer(authorizer))
	for _, revoked = range []bool{false, true} {
		for _, headers := range []http.Header{{}, {"If-None-Match": {"*"}}, {"If-Match": {`"stale"`}}} {
			req := httptest.NewRequest(http.MethodGet, "/?type=arrow&sql=SELECT+1", nil)
			req.Header = headers
			req = req.WithContext(context.WithValue(req.Context(), preaggregateScopeKey{}, query.PreAggregateScope{Key: "reader"}))
			response := httptest.NewRecorder()
			h.ServeHTTP(response, req)
			status := http.StatusOK
			if revoked {
				status = http.StatusForbidden
			}
			require.Equal(t, status, response.Code, response.Body.String())
			require.Equal(t, "no-store", response.Header().Get("Cache-Control"))
			require.Empty(t, response.Header().Get("ETag"))
		}
	}
	require.Equal(t, 6, calls)
}

func TestHTTPPreaggregateDeadline(t *testing.T) {
	h, _ := setupPreaggregateHandler(t, query.PreAggregateLimits{Timeout: 10 * time.Millisecond})
	response := preaggregateRequest(t, h, http.MethodPost, query.PreAggregateScope{Key: "reader"}, map[string]any{"type": "preagg", "sql": "SELECT sum(i) AS n FROM range(1000000000) t(i)"})
	require.Equal(t, http.StatusGatewayTimeout, response.Code, response.Body.String())
	require.JSONEq(t, `{"error":"Gateway Timeout","code":"deadline_exceeded"}`, response.Body.String())
}

func TestPreaggregateConfiguration(t *testing.T) {
	db := setupTestDB(t)
	_, err := New(db, WithPreaggregation(PreAggregateOptions{}))
	require.ErrorContains(t, err, "scope resolver is required")
	options := PreAggregateOptions{Scope: func(context.Context) (query.PreAggregateScope, error) {
		return query.PreAggregateScope{}, errors.New("denied")
	}}
	_, err = New(db, WithPreaggregation(options), WithSchemaMatchHeaders("X-Tenant"))
	require.ErrorContains(t, err, "cannot be combined")
}
