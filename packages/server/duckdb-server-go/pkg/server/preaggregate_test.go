package server

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extensions"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

type preaggregateScopeKey struct{}

const preaggregateScope = "reader"

func tenantPolicy() *query.ValidationPolicy {
	catalog := "memory"
	return &query.ValidationPolicy{AllowedTables: []query.TableRule{{Catalog: &catalog, Schema: "tenant", Table: "*"}}}
}

// tenantAuthorizer grants the tenant schema and reports every source SELECT it is asked about.
func tenantAuthorizer(sources *[]string, revoked *bool) Option {
	return WithAuthorizer(AuthorizerFunc[struct{}](func(*http.Request) (CommandAuthorizer[struct{}], error) {
		return func(_ context.Context, command Command[struct{}]) (*query.ValidationPolicy, error) {
			if command.Type() == CommandPreagg {
				if sources != nil {
					*sources = append(*sources, command.SQL())
				}
				if revoked != nil && *revoked {
					return nil, ErrPermissionDenied
				}
			}
			return tenantPolicy(), nil
		}, nil
	}))
}

// setupValidatedDB creates fixtures through the connector because Exec is refused once validation is on.
func setupValidatedDB(t *testing.T, setup string, opts ...query.OptionFunc) (*query.DB, func(string)) {
	t.Helper()
	connector, err := duckdb.NewConnector(":memory:?autoload_known_extensions=false&autoinstall_known_extensions=false", func(execer driver.ExecerContext) error {
		return extensions.InstallAndLoad(t.Context(), execer, "gatekeeper", "community")
	})
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, connector.Close()) })
	trusted := func(statement string) {
		t.Helper()
		conn, err := connector.Connect(t.Context())
		require.NoError(t, err)
		defer func() { require.NoError(t, conn.Close()) }()
		_, err = conn.(driver.ExecerContext).ExecContext(t.Context(), statement, nil)
		require.NoError(t, err)
	}
	trusted(setup)
	db, err := query.New(t.Context(), connector, append([]query.OptionFunc{query.WithValidation()}, opts...)...)
	require.NoError(t, err)
	t.Cleanup(db.Close)
	return db, trusted
}

func setupPreaggregateHandler(t *testing.T, opts ...Option) (http.Handler, func(string)) {
	t.Helper()
	db, trusted := setupValidatedDB(t, `CREATE SCHEMA tenant;
CREATE TABLE tenant.source AS SELECT * FROM (VALUES ('a'), ('b'), ('b')) t(dim);
CREATE SCHEMA private;
CREATE TABLE private.source AS SELECT 42 AS secret`)
	opts = append(opts, WithPreaggregation(PreAggregateOptions[struct{}]{
		Namespace: func(ctx context.Context, _ Command[struct{}]) (query.Namespace, error) {
			schema, ok := ctx.Value(preaggregateScopeKey{}).(string)
			if !ok {
				return query.Namespace{}, ErrUnauthenticated
			}
			return query.Namespace{Schema: []string{schema}}, nil
		},
	}))
	h, err := New(db, opts...)
	require.NoError(t, err)
	return h, trusted
}

func preaggregateRequest(t *testing.T, h http.Handler, method string, scope string, payload map[string]any) *httptest.ResponseRecorder {
	t.Helper()
	body, err := json.Marshal(payload)
	require.NoError(t, err)
	target := "/"
	if method == http.MethodGet {
		target += "?type=" + url.QueryEscape(payload["type"].(string)) + "&sql=" + url.QueryEscape(payload["sql"].(string))
	}
	req := httptest.NewRequest(method, target, strings.NewReader(string(body)))
	if scope != "" {
		req = req.WithContext(context.WithValue(req.Context(), preaggregateScopeKey{}, scope))
	}
	response := httptest.NewRecorder()
	h.ServeHTTP(response, req)
	return response
}

func TestHTTPPreaggregate(t *testing.T) {
	h, trusted := setupPreaggregateHandler(t)
	source := `SELECT dim, count(*) AS n FROM memory.tenant.source GROUP BY dim`
	payload := map[string]any{"type": "preagg", "sql": source, "catalog": "caller", "schema": "caller", "table": "caller", "application": map[string]any{"id": 42}}
	response := preaggregateRequest(t, h, http.MethodPost, preaggregateScope, payload)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, "application/json", response.Header().Get("Content-Type"))
	require.Equal(t, "no-store", response.Header().Get("Cache-Control"))
	var table query.PreaggResponse
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &table))
	require.Equal(t, "memory", table.Reference.Catalog)
	require.Equal(t, []string{preaggregateScope}, table.Reference.Schema)
	require.NotEqual(t, "caller", table.Reference.Table)
	require.False(t, table.CreatedAt.IsZero())
	require.Equal(t, query.Stats{Rows: 2, Bytes: 48}, table.Stats)
	require.Contains(t, response.Body.String(), `"rows":2`)

	again := preaggregateRequest(t, h, http.MethodPost, preaggregateScope, payload)
	require.JSONEq(t, response.Body.String(), again.Body.String())
	ref := table.Reference.String()
	read := map[string]any{"type": "arrow", "sql": "SELECT * FROM " + ref + " ORDER BY dim"}
	response = preaggregateRequest(t, h, http.MethodPost, preaggregateScope, read)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, []map[string]any{{"dim": "a", "n": float64(1)}, {"dim": "b", "n": float64(2)}}, arrowRows(t, response.Body.Bytes()))
	response = preaggregateRequest(t, h, http.MethodGet, preaggregateScope, read)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, "no-store", response.Header().Get("Cache-Control"))
	require.Empty(t, response.Header().Get("ETag"))

	trusted("DROP TABLE " + ref)
	response = preaggregateRequest(t, h, http.MethodPost, preaggregateScope, read)
	require.Equal(t, http.StatusNotFound, response.Code)
	var failure struct {
		Error     string          `json:"error"`
		Code      string          `json:"code"`
		Reason    string          `json:"reason"`
		Reference query.Reference `json:"reference"`
	}
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &failure))
	require.Equal(t, "table_not_found", failure.Code)
	require.Equal(t, "materialization_missing", failure.Reason)
	require.Equal(t, table.Reference, failure.Reference)
	require.NotContains(t, response.Body.String(), `"catalog":"memory","schema":"`)
	response = preaggregateRequest(t, h, http.MethodPost, preaggregateScope, payload)
	require.Equal(t, http.StatusOK, response.Code)
	response = preaggregateRequest(t, h, http.MethodPost, preaggregateScope, read)
	require.Equal(t, http.StatusOK, response.Code)
}

func TestHTTPPreaggregateAuthorization(t *testing.T) {
	var revoked bool
	var sources []string
	h, _ := setupPreaggregateHandler(t, tenantAuthorizer(&sources, &revoked))
	source := `SELECT * FROM memory.tenant.source`
	payload := map[string]any{"type": "preagg", "sql": source}
	response := preaggregateRequest(t, h, http.MethodPost, preaggregateScope, payload)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	var table query.PreaggResponse
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &table))
	read := map[string]any{"type": "arrow", "sql": "SELECT * FROM " + table.Reference.String()}
	response = preaggregateRequest(t, h, http.MethodPost, preaggregateScope, read)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, []string{source, source}, sources)

	response = preaggregateRequest(t, h, http.MethodPost, "other", read)
	require.Equal(t, http.StatusForbidden, response.Code)
	require.JSONEq(t, `{"error":"Forbidden","code":"forbidden","reason":"policy_denied"}`, response.Body.String())
	response = preaggregateRequest(t, h, http.MethodPost, preaggregateScope, map[string]any{"type": "preagg", "sql": "SELECT * FROM memory.private.source"})
	require.Equal(t, http.StatusForbidden, response.Code)
	revoked = true
	for _, command := range []map[string]any{payload, read} {
		response = preaggregateRequest(t, h, http.MethodPost, preaggregateScope, command)
		require.Equal(t, http.StatusForbidden, response.Code)
	}
}

func TestHTTPPreaggregateErrors(t *testing.T) {
	h, _ := setupPreaggregateHandler(t, tenantAuthorizer(nil, nil))
	for _, test := range []struct {
		method string
		typ    string
		sql    string
		status int
		code   string
		reason string
		field  string
	}{
		{http.MethodGet, "preagg", "SELECT 1", 400, "bad_request", "invalid_field", "type"},
		{http.MethodPost, "preagg", "SELECT 1; SELECT 2", 403, "forbidden", "policy_denied", ""},
		{http.MethodPost, "preagg", "SELECT * FROM missing", 400, "bad_request", "invalid_field", "sql"},
		{http.MethodPost, "preagg", "SELECT * FROM", 400, "bad_request", "sql_parse_error", ""},
		{http.MethodPost, "exec", "CREATE TABLE injected AS SELECT 1", 400, "unsupported_command", "command_disabled", ""},
		{http.MethodPost, "preagg", "SELECT * FROM memory.private.source", 403, "forbidden", "policy_denied", ""},
		{http.MethodPost, "", "SELECT 1", 400, "bad_request", "missing_field", "type"},
		{http.MethodPost, "preagg", "", 400, "bad_request", "missing_field", "sql"},
	} {
		t.Run(test.sql+test.method, func(t *testing.T) {
			response := preaggregateRequest(t, h, test.method, preaggregateScope, map[string]any{"type": test.typ, "sql": test.sql})
			require.Equal(t, test.status, response.Code, response.Body.String())
			var failure map[string]any
			require.NoError(t, json.Unmarshal(response.Body.Bytes(), &failure))
			require.Equal(t, test.code, failure["code"])
			require.Equal(t, test.reason, failure["reason"])
			if test.field == "" {
				require.NotContains(t, failure, "field")
			} else {
				require.Equal(t, test.field, failure["field"])
			}
			require.NotContains(t, failure, "reference")
		})
	}

	response := preaggregateRequest(t, h, http.MethodPost, "", map[string]any{"type": "preagg", "sql": "SELECT 1"})
	require.Equal(t, http.StatusUnauthorized, response.Code)
	require.JSONEq(t, `{"error":"Unauthorized","code":"unauthenticated","reason":"authentication_required"}`, response.Body.String())
}

func TestHTTPPreaggregateUnsupported(t *testing.T) {
	db, _ := setupValidatedDB(t, "SELECT 1")
	h, err := New(db)
	require.NoError(t, err)
	response := preaggregateRequest(t, h, http.MethodPost, "", map[string]any{"type": "preagg", "sql": "SELECT 1"})
	require.Equal(t, http.StatusBadRequest, response.Code)
	require.Equal(t, "text/plain; charset=utf-8", response.Header().Get("Content-Type"))
}

func TestHTTPPreaggregatePayload(t *testing.T) {
	var sources []string
	authorizer := AuthorizerFunc[*applicationPayload](func(*http.Request) (CommandAuthorizer[*applicationPayload], error) {
		return func(_ context.Context, command Command[*applicationPayload]) (*query.ValidationPolicy, error) {
			if command.Type() == CommandPreagg {
				fields := command.Payload()
				if fields == nil || fields.ProjectID != 42 {
					return nil, ErrPermissionDenied
				}
				sources = append(sources, command.SQL())
			}
			command.Payload().ProjectID = 0
			return nil, nil
		}, nil
	})
	h, _ := setupPreaggregateHandler(t, WithAuthorizer(authorizer))
	source := `SELECT 42 AS x`
	response := preaggregateRequest(t, h, http.MethodPost, "project:42", map[string]any{"type": "preagg", "sql": source, "projectId": 42})
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	var table query.PreaggResponse
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &table))
	read := map[string]any{"type": "arrow", "sql": "SELECT * FROM " + table.Reference.String(), "projectId": 42}
	response = preaggregateRequest(t, h, http.MethodPost, "project:42", read)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, []string{source, source}, sources)
	read["projectId"] = 43
	response = preaggregateRequest(t, h, http.MethodPost, "project:42", read)
	require.Equal(t, http.StatusForbidden, response.Code)
}

func TestHTTPPreaggregateNoStore(t *testing.T) {
	var revoked bool
	var calls int
	authorizer := AuthorizerFunc[struct{}](func(*http.Request) (CommandAuthorizer[struct{}], error) {
		return func(context.Context, Command[struct{}]) (*query.ValidationPolicy, error) {
			calls++
			if revoked {
				return nil, ErrPermissionDenied
			}
			return nil, nil
		}, nil
	})
	h, _ := setupPreaggregateHandler(t, WithCacheControl("public, max-age=60"), WithAuthorizer(authorizer))
	for _, revoked = range []bool{false, true} {
		for _, headers := range []http.Header{{}, {"If-None-Match": {"*"}}, {"If-Match": {`"stale"`}}} {
			req := httptest.NewRequest(http.MethodGet, "/?type=arrow&sql=SELECT+1", nil)
			req.Header = headers
			req = req.WithContext(context.WithValue(req.Context(), preaggregateScopeKey{}, "reader"))
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

func TestHTTPPreaggregateNamespaceFromPayload(t *testing.T) {
	dir := t.TempDir()
	db, _ := setupValidatedDB(t, "SELECT 1")
	h, err := New(db, WithPreaggregation(PreAggregateOptions[*applicationPayload]{
		Materializer: &query.ParquetMaterializer{Directory: dir},
		Namespace: func(_ context.Context, command Command[*applicationPayload]) (query.Namespace, error) {
			if command.Payload() == nil || command.Payload().ProjectID == 0 {
				return query.Namespace{}, ErrPermissionDenied
			}
			return query.Namespace{Schema: []string{fmt.Sprintf("project_%d", command.Payload().ProjectID)}}, nil
		},
	}))
	require.NoError(t, err)
	response := preaggregateRequest(t, h, http.MethodPost, "", map[string]any{"type": "preagg", "sql": "SELECT 42 AS x", "projectId": 7})
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	var table query.PreaggResponse
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &table))
	require.Equal(t, []string{"project_7"}, table.Reference.Schema)
	_, err = os.Stat(filepath.Join(dir, "memory", "project_7", table.Reference.Table+".parquet"))
	require.NoError(t, err)
	read := map[string]any{"type": "arrow", "sql": "SELECT * FROM " + table.Reference.String(), "projectId": 7}
	response = preaggregateRequest(t, h, http.MethodPost, "", read)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, []map[string]any{{"x": float64(42)}}, arrowRows(t, response.Body.Bytes()))
	response = preaggregateRequest(t, h, http.MethodPost, "", map[string]any{"type": "preagg", "sql": "SELECT 1", "projectId": "seven"})
	require.Equal(t, http.StatusBadRequest, response.Code)
	require.JSONEq(t, `{"error":"Bad Request","code":"bad_request","reason":"invalid_field","field":"projectId"}`, response.Body.String())
	response = preaggregateRequest(t, h, http.MethodGet, "", map[string]any{"type": "arrow", "sql": "SELECT 1"})
	require.Equal(t, http.StatusForbidden, response.Code, response.Body.String())
}

func TestHTTPPreaggregateDefaultNamespace(t *testing.T) {
	db, _ := setupValidatedDB(t, "SELECT 1")
	h, err := New(db, WithPreaggregation(PreAggregateOptions[struct{}]{}))
	require.NoError(t, err)
	response := preaggregateRequest(t, h, http.MethodPost, "", map[string]any{"type": "preagg", "sql": "SELECT 42 AS x"})
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	var table query.PreaggResponse
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &table))
	require.Equal(t, []string{"mosaic_preagg"}, table.Reference.Schema)
	response = preaggregateRequest(t, h, http.MethodPost, "", map[string]any{"type": "arrow", "sql": "SELECT * FROM " + table.Reference.String()})
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, []map[string]any{{"x": float64(42)}}, arrowRows(t, response.Body.Bytes()))
}

func TestPreaggregateConfiguration(t *testing.T) {
	options := PreAggregateOptions[struct{}]{}
	_, err := New(setupConfiguredDB(t, ""), WithPreaggregation(options))
	require.ErrorContains(t, err, "requires WithValidation")
	_, err = New(setupConfiguredDB(t, "", query.WithValidation(), query.WithMaxConnections(1)), WithPreaggregation(options))
	require.NoError(t, err)
}
