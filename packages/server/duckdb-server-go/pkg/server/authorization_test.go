package server

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"maps"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

type spyCommandExecutor struct {
	failOnCallExecutor
	exec    func(context.Context, string) error
	queryFn func(context.Context, string, *query.ValidationPolicy) ([]byte, error)
}

func (s *spyCommandExecutor) Exec(ctx context.Context, sql string) error {
	if s.exec == nil {
		return s.failOnCallExecutor.Exec(ctx, sql)
	}
	return s.exec(ctx, sql)
}

func (s *spyCommandExecutor) Query(ctx context.Context, sql string, policy *query.ValidationPolicy) ([]byte, error) {
	if s.queryFn == nil {
		return s.failOnCallExecutor.Query(ctx, sql, policy)
	}
	return s.queryFn(ctx, sql, policy)
}

type authorizationContextKey struct{}

func TestAuthorizerReceivesCommandAndRequestContext(t *testing.T) {
	const sql = "SELECT 42 AS answer /* preserve exactly */"
	for _, req := range []*http.Request{
		httptest.NewRequest(http.MethodGet, "/?"+url.Values{"type": {string(CommandArrow)}, "sql": {sql}}.Encode(), nil),
		httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"arrow","sql":"`+sql+`"}`)),
	} {
		t.Run(req.Method, func(t *testing.T) {
			requireRequestContext := func(ctx context.Context) {
				t.Helper()
				require.Equal(t, "user-42", ctx.Value(authorizationContextKey{}))
				require.ErrorIs(t, ctx.Err(), context.Canceled)
			}
			var events []string
			spy := &spyCommandExecutor{
				failOnCallExecutor: failOnCallExecutor{t},
				queryFn: func(ctx context.Context, gotSQL string, policy *query.ValidationPolicy) ([]byte, error) {
					events = append(events, "executor")
					requireRequestContext(ctx)
					require.Equal(t, sql, gotSQL)
					require.Nil(t, policy)
					return []byte("result"), nil
				},
			}
			handler := mustHandler(t, spy, WithAuthorizer(func(r *http.Request, command Command[json.RawMessage]) (*query.ValidationPolicy, error) {
				events = append(events, "authorize")
				requireRequestContext(r.Context())
				require.Equal(t, CommandArrow, command.Type())
				require.Equal(t, sql, command.SQL())
				return nil, nil
			}))

			ctx, cancel := context.WithCancel(context.WithValue(t.Context(), authorizationContextKey{}, "user-42"))
			cancel()
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, req.WithContext(ctx))

			require.Equal(t, http.StatusOK, res.Code, res.Body.String())
			require.Equal(t, "result", res.Body.String())
			require.Equal(t, []string{"authorize", "executor"}, events)
		})
	}
}

func TestAuthorizerHandlesConcurrentRequests(t *testing.T) {
	const requestCount = 32
	type fields struct {
		SQL         string `json:"sql"`
		Application struct {
			Request int `json:"request"`
		} `json:"application"`
	}

	var authorizerCalls atomic.Int32
	var executorCalls atomic.Int32
	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryFn: func(context.Context, string, *query.ValidationPolicy) ([]byte, error) {
			executorCalls.Add(1)
			return nil, nil
		},
	}

	handler := mustHandler(t, spy, WithAuthorizer(func(r *http.Request, command Command[*fields]) (*query.ValidationPolicy, error) {
		authorizerCalls.Add(1)
		expected := r.Context().Value(authorizationContextKey{}).(int)
		payload := command.Payload()
		if payload.Application.Request != expected || payload.SQL != command.SQL() {
			return nil, ErrInvalidCommand
		}
		payload.Application.Request = -1
		payload.SQL = "changed"
		if command.SQL() != fmt.Sprintf("SELECT %d", expected) {
			return nil, ErrInvalidCommand
		}
		return nil, nil
	}))

	statuses := make(chan int, requestCount)
	var wg sync.WaitGroup
	for i := range requestCount {
		wg.Go(func() {
			body := fmt.Sprintf(`{"type":"arrow","sql":"SELECT %d","application":{"request":%d}}`, i, i)
			ctx := context.WithValue(t.Context(), authorizationContextKey{}, i)
			req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body)).WithContext(ctx)
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, req)
			statuses <- res.Code
		})
	}
	wg.Wait()
	close(statuses)

	for status := range statuses {
		require.Equal(t, http.StatusOK, status)
	}
	require.Equal(t, int32(requestCount), authorizerCalls.Load())
	require.Equal(t, int32(requestCount), executorCalls.Load())
}

func TestHTTPCommandAuthorizationStatusMapping(t *testing.T) {
	tests := []struct {
		name       string
		authErr    error
		wantStatus int
		logged     bool
	}{
		{
			name:       "unauthenticated",
			authErr:    fmt.Errorf("%w: expired credential", ErrUnauthenticated),
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "permission denied",
			authErr:    fmt.Errorf("%w: tenant policy", ErrPermissionDenied),
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "invalid policy command",
			authErr:    fmt.Errorf("%w: unsupported statement", ErrInvalidCommand),
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "unexpected failure is logged",
			authErr:    errors.New("authorization backend failed with bearer super-secret-token"),
			wantStatus: http.StatusInternalServerError,
			logged:     true,
		},
		{
			name:       "validation diagnostics pass through",
			authErr:    fmt.Errorf("%w: %w", ErrPermissionDenied, errors.Join(query.ErrValidation, query.ErrorDetails{Code: "forbidden", Message: "private-diagnostic"})),
			wantStatus: http.StatusForbidden,
			logged:     true,
		},
		{
			name:       "canceled request is not logged",
			authErr:    context.Canceled,
			wantStatus: http.StatusInternalServerError,
		},
		{
			name:       "expired deadline is not logged",
			authErr:    context.DeadlineExceeded,
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		for _, method := range []string{http.MethodGet, http.MethodPost} {
			t.Run(tt.name+"/"+method, func(t *testing.T) {
				var logs bytes.Buffer
				var commandCalls atomic.Int32
				authorizer := func(*http.Request, Command[json.RawMessage]) (*query.ValidationPolicy, error) {
					commandCalls.Add(1)
					return &query.ValidationPolicy{}, tt.authErr
				}

				handler := mustHandler(t, failOnCallExecutor{t},
					WithAuthorizer(authorizer),
					WithLogger(slog.New(slog.NewJSONHandler(&logs, nil))),
				)

				var req *http.Request
				if method == http.MethodGet {
					values := make(url.Values)
					values.Set("type", string(CommandExec))
					values.Set("sql", "CREATE TABLE must_not_exist(value INTEGER)")
					req = httptest.NewRequest(method, "/?"+values.Encode(), nil)
				} else {
					req = httptest.NewRequest(method, "/", strings.NewReader(`{"type":"exec","sql":"CREATE TABLE must_not_exist(value INTEGER)"}`))
				}
				res := httptest.NewRecorder()
				handler.ServeHTTP(res, req)

				require.Equal(t, tt.wantStatus, res.Code, res.Body.String())
				require.Equal(t, int32(1), commandCalls.Load())
				require.Equal(t, tt.authErr.Error(), strings.TrimSpace(res.Body.String()))
				if tt.logged {
					var record map[string]any
					require.NoError(t, json.Unmarshal(bytes.TrimSpace(logs.Bytes()), &record))
					require.Equal(t, tt.authErr.Error(), record["error"])
				} else {
					require.Empty(t, logs.Bytes())
				}
			})
		}
	}
}

func TestHTTPRequestChecksPrecedeAuthorization(t *testing.T) {
	for _, tt := range []struct {
		name, method, target string
		header               http.Header
		status               int
	}{
		{"GET missing SQL", http.MethodGet, "/?type=arrow", nil, http.StatusBadRequest},
		{"HEAD", http.MethodHead, "/?type=arrow&sql=SELECT+1", nil, http.StatusMethodNotAllowed},
		{"CORS preflight", http.MethodOptions, "/", http.Header{"Origin": {"https://app.example"}, "Access-Control-Request-Method": {http.MethodPost}}, http.StatusOK},
		{"cross-origin GET exec", http.MethodGet, "/?type=exec&sql=SELECT+1", http.Header{"Origin": {"https://other.example"}, "Sec-Fetch-Site": {"cross-site"}}, http.StatusForbidden},
	} {
		t.Run(tt.name, func(t *testing.T) {
			var calls atomic.Int32
			handler := mustHandler(t, failOnCallExecutor{t},
				WithCORS(CORSOptions{AllowedOrigins: []string{"https://app.example"}}),
				WithAuthorizer(func(*http.Request, Command[json.RawMessage]) (*query.ValidationPolicy, error) {
					calls.Add(1)
					return nil, nil
				}),
			)
			req := httptest.NewRequest(tt.method, tt.target, nil)
			maps.Copy(req.Header, tt.header)
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, req)

			require.Equal(t, tt.status, res.Code, res.Body.String())
			require.Zero(t, calls.Load())
		})
	}
}

func TestNilAuthorizerPolicyPreservesGlobalValidation(t *testing.T) {
	db := setupConfiguredDB(t, "CALL gatekeeper_configure(blocked_functions := [{catalog: 'system', schema_path: ['main'], name: 'md5'}])", query.WithValidation())
	handler := mustHandler(t, db, WithAuthorizer(func(*http.Request, Command[struct{}]) (*query.ValidationPolicy, error) { return nil, nil }))
	for _, tt := range []struct {
		body   string
		status int
		want   string
	}{
		{`{"type":"arrow","sql":"SELECT md5('x')"}`, http.StatusForbidden, "md5"},
		{`{"type":"exec","sql":"SELECT 1"}`, http.StatusBadRequest, query.ErrExecWithValidation.Error()},
	} {
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.body)))
		require.Equal(t, tt.status, res.Code, res.Body.String())
		require.Contains(t, res.Body.String(), tt.want)
	}
}

func TestAuthorizerScopesValidationPerCommand(t *testing.T) {
	db := setupConfiguredDB(t, "")
	require.NoError(t, db.Exec(t.Context(), `CREATE SCHEMA tenant_a; CREATE SCHEMA tenant_b;
		CREATE TABLE tenant_a.items AS SELECT 1 AS value; CREATE TABLE tenant_b.items AS SELECT 2 AS value`))

	type payload struct {
		Tenant string `json:"tenant"`
	}
	handler := mustHandler(t, db, WithAuthorizer(func(_ *http.Request, command Command[payload]) (*query.ValidationPolicy, error) {
		if command.Payload().Tenant == "" {
			return nil, ErrPermissionDenied
		}
		return &query.ValidationPolicy{AllowedTables: []query.TableRule{{SchemaPath: []string{command.Payload().Tenant}, Table: "*"}}}, nil
	}))
	post := func(body string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, req)
		return res
	}
	require.Equal(t, http.StatusOK, post(`{"type":"arrow","sql":"SELECT * FROM tenant_a.items","tenant":"tenant_a"}`).Code)
	require.Equal(t, http.StatusForbidden, post(`{"type":"arrow","sql":"SELECT * FROM tenant_b.items","tenant":"tenant_a"}`).Code)
	require.Equal(t, http.StatusForbidden, post(`{"type":"arrow","sql":"SELECT 1"}`).Code)
	res := post(`{"type":"exec","sql":"SELECT 1","tenant":"tenant_a"}`)
	require.Equal(t, http.StatusBadRequest, res.Code)
	require.Contains(t, res.Body.String(), query.ErrExecWithValidation.Error())
}
