package server

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
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

func TestCommandDenialPrecedesExecutor(t *testing.T) {
	var executorCalls int
	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		exec: func(context.Context, string) error {
			executorCalls++
			return nil
		},
		queryFn: func(context.Context, string, *query.ValidationPolicy) ([]byte, error) {
			executorCalls++
			return nil, nil
		},
	}

	handler := mustHandler(t, spy, WithAuthorizer(func(*http.Request, Command[json.RawMessage]) (*query.ValidationPolicy, error) {
		return &query.ValidationPolicy{}, ErrPermissionDenied
	}))

	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"arrow","sql":"SELECT * FROM sensitive_data"}`))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	require.Equal(t, http.StatusForbidden, res.Code, res.Body.String())
	require.Zero(t, executorCalls, "denial must occur before query validation or database execution")
}

func TestCommandAuthorizationRunsImmediatelyBeforeExecutor(t *testing.T) {
	const sql = "SELECT 1 AS value"

	var events []string
	appendEvent := func(event string) {
		events = append(events, event)
	}

	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryFn: func(_ context.Context, gotSQL string, policy *query.ValidationPolicy) ([]byte, error) {
			appendEvent("executor")
			require.Equal(t, sql, gotSQL)
			require.Nil(t, policy)
			return []byte("result"), nil
		},
	}

	handler := mustHandler(t, spy, WithAuthorizer(func(_ *http.Request, command Command[json.RawMessage]) (*query.ValidationPolicy, error) {
		appendEvent("authorize")
		require.Equal(t, CommandArrow, command.Type())
		require.Equal(t, sql, command.SQL())
		return nil, nil
	}))

	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"arrow","sql":"SELECT 1 AS value"}`))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	require.Equal(t, http.StatusOK, res.Code, res.Body.String())
	require.Equal(t, "result", res.Body.String())
	require.Equal(t, []string{"authorize", "executor"}, events)
}

func TestCanceledRequestContextReachesAuthorizationAndExecutor(t *testing.T) {
	var authorizerContextErr error
	var executorContextErr error

	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryFn: func(ctx context.Context, _ string, _ *query.ValidationPolicy) ([]byte, error) {
			executorContextErr = ctx.Err()
			return nil, nil
		},
	}

	handler := mustHandler(t, spy, WithAuthorizer(func(r *http.Request, _ Command[json.RawMessage]) (*query.ValidationPolicy, error) {
		authorizerContextErr = r.Context().Err()
		return nil, nil
	}))

	ctx, cancel := context.WithCancel(t.Context())
	cancel()
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"arrow","sql":"SELECT 1"}`)).WithContext(ctx)
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	require.Equal(t, http.StatusOK, res.Code, res.Body.String())
	require.ErrorIs(t, authorizerContextErr, context.Canceled)
	require.ErrorIs(t, executorContextErr, context.Canceled)
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
		wg.Add(1)
		go func() {
			defer wg.Done()
			body := fmt.Sprintf(`{"type":"arrow","sql":"SELECT %d","application":{"request":%d}}`, i, i)
			ctx := context.WithValue(t.Context(), authorizationContextKey{}, i)
			req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body)).WithContext(ctx)
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, req)
			statuses <- res.Code
		}()
	}
	wg.Wait()
	close(statuses)

	for status := range statuses {
		require.Equal(t, http.StatusOK, status)
	}
	require.Equal(t, int32(requestCount), authorizerCalls.Load())
	require.Equal(t, int32(requestCount), executorCalls.Load())
}

type authorizationContextKey struct{}

func TestHTTPAuthorizerReceivesExactValidatedCommandAndRequestContext(t *testing.T) {
	const (
		identity = "user-42"
		sql      = "SELECT 42 AS answer /* preserve exactly */"
	)

	tests := []struct {
		name string
		new  func(*testing.T) *http.Request
	}{
		{
			name: "GET",
			new: func(t *testing.T) *http.Request {
				t.Helper()
				values := make(url.Values)
				values.Set("type", string(CommandArrow))
				values.Set("sql", sql)
				return httptest.NewRequest(http.MethodGet, "/?"+values.Encode(), nil)
			},
		},
		{
			name: "POST",
			new: func(t *testing.T) *http.Request {
				t.Helper()
				body, err := json.Marshal(map[string]any{
					"type": CommandArrow,
					"sql":  sql,
				})
				require.NoError(t, err)
				return httptest.NewRequest(http.MethodPost, "/", strings.NewReader(string(body)))
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupTestDB(t)
			var calls atomic.Int32

			authorizer := func(r *http.Request, command Command[json.RawMessage]) (*query.ValidationPolicy, error) {
				calls.Add(1)
				require.Equal(t, identity, r.Context().Value(authorizationContextKey{}))
				require.Equal(t, CommandArrow, command.Type())
				require.Equal(t, sql, command.SQL())
				return nil, nil
			}

			handler, err := New(db, WithAuthorizer(authorizer))
			require.NoError(t, err)

			req := tt.new(t)
			req = req.WithContext(context.WithValue(req.Context(), authorizationContextKey{}, identity))
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, req)

			require.Equal(t, http.StatusOK, res.Code, res.Body.String())
			require.Equal(t, int32(1), calls.Load())
		})
	}
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
					return nil, tt.authErr
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
		name, method, target, body string
		status                     int
	}{
		{"POST missing SQL", http.MethodPost, "/", `{"type":"arrow"}`, http.StatusBadRequest},
		{"GET missing SQL", http.MethodGet, "/?type=arrow", "", http.StatusBadRequest},
		{"HEAD", http.MethodHead, "/?type=arrow&sql=SELECT+1", "", http.StatusMethodNotAllowed},
	} {
		t.Run(tt.name, func(t *testing.T) {
			var calls atomic.Int32
			handler := mustHandler(t, failOnCallExecutor{t}, WithAuthorizer(func(*http.Request, Command[json.RawMessage]) (*query.ValidationPolicy, error) {
				calls.Add(1)
				return nil, nil
			}))

			res := httptest.NewRecorder()
			handler.ServeHTTP(res, httptest.NewRequest(tt.method, tt.target, strings.NewReader(tt.body)))

			require.Equal(t, tt.status, res.Code, res.Body.String())
			require.Zero(t, calls.Load())
		})
	}
}

func TestGenericAuthorizationDoesNotBypassRestrictedExec(t *testing.T) {
	allow := WithAuthorizer(func(*http.Request, Command[json.RawMessage]) (*query.ValidationPolicy, error) { return nil, nil })

	t.Run("validation", func(t *testing.T) {
		db := setupConfiguredDB(t, "", query.WithValidation())
		handler, err := New(db, allow)
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"exec","sql":"SELECT 1"}`))
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, req)

		require.Equal(t, http.StatusBadRequest, res.Code, res.Body.String())
		require.Contains(t, res.Body.String(), query.ErrExecWithValidation.Error())
	})

}

func TestNilAuthorizerPolicyPreservesGlobalValidation(t *testing.T) {
	db := setupConfiguredDB(t, "CALL gatekeeper_configure(blocked_functions := [{catalog: 'system', schema_path: ['main'], name: 'md5'}])", query.WithValidation())
	handler := mustHandler(t, db, WithAuthorizer(func(*http.Request, Command[struct{}]) (*query.ValidationPolicy, error) { return nil, nil }))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"arrow","sql":"SELECT md5('x')"}`)))
	require.Equal(t, http.StatusForbidden, res.Code)
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
