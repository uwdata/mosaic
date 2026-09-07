package server

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/coder/websocket/wsjson"
	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

type spyCommandExecutor struct {
	failOnCallExecutor
	exec       func(context.Context, string) error
	queryArrow func(context.Context, string, []string) ([]byte, error)
	queryJSON  func(context.Context, string, []string) (json.RawMessage, error)
}

func (s *spyCommandExecutor) Exec(ctx context.Context, sql string) error {
	if s.exec == nil {
		return s.failOnCallExecutor.Exec(ctx, sql)
	}
	return s.exec(ctx, sql)
}

func (s *spyCommandExecutor) QueryArrow(ctx context.Context, sql string, schemas []string) ([]byte, error) {
	if s.queryArrow == nil {
		return s.failOnCallExecutor.QueryArrow(ctx, sql, schemas)
	}
	return s.queryArrow(ctx, sql, schemas)
}

func (s *spyCommandExecutor) QueryJSON(ctx context.Context, sql string, schemas []string) (json.RawMessage, error) {
	if s.queryJSON == nil {
		return s.failOnCallExecutor.QueryJSON(ctx, sql, schemas)
	}
	return s.queryJSON(ctx, sql, schemas)
}

func TestCommandDenialPrecedesExecutor(t *testing.T) {
	var executorCalls int
	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		exec: func(context.Context, string) error {
			executorCalls++
			return nil
		},
		queryArrow: func(context.Context, string, []string) ([]byte, error) {
			executorCalls++
			return nil, nil
		},
		queryJSON: func(context.Context, string, []string) (json.RawMessage, error) {
			executorCalls++
			return json.RawMessage(`[]`), nil
		},
	}

	handler := mustHandler(t, spy, WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
		return func(context.Context, Command) error {
			return ErrPermissionDenied
		}, nil
	})))

	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"json","sql":"SELECT * FROM sensitive_data"}`))
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
		queryJSON: func(_ context.Context, gotSQL string, schemas []string) (json.RawMessage, error) {
			appendEvent("executor")
			require.Equal(t, sql, gotSQL)
			require.Empty(t, schemas)
			return json.RawMessage(`[{"value":1}]`), nil
		},
	}

	handler := mustHandler(t, spy, WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
		return func(_ context.Context, command Command) error {
			appendEvent("authorize")
			require.Equal(t, CommandJSON, command.Type())
			require.Equal(t, sql, command.SQL())
			return nil
		}, nil
	})))

	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"json","sql":"SELECT 1 AS value"}`))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	require.Equal(t, http.StatusOK, res.Code, res.Body.String())
	require.JSONEq(t, `[{"value":1}]`, res.Body.String())
	require.Equal(t, []string{"authorize", "executor"}, events)
}

func TestCanceledRequestContextReachesAuthorizationAndExecutor(t *testing.T) {
	var requestContextErr error
	var commandContextErr error
	var executorContextErr error

	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryJSON: func(ctx context.Context, _ string, _ []string) (json.RawMessage, error) {
			executorContextErr = ctx.Err()
			return json.RawMessage(`[]`), nil
		},
	}

	handler := mustHandler(t, spy, WithAuthorizer(AuthorizerFunc(func(r *http.Request) (CommandAuthorizer, error) {
		requestContextErr = r.Context().Err()
		return func(ctx context.Context, _ Command) error {
			commandContextErr = ctx.Err()
			return nil
		}, nil
	})))

	ctx, cancel := context.WithCancel(t.Context())
	cancel()
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"json","sql":"SELECT 1"}`)).WithContext(ctx)
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	require.Equal(t, http.StatusOK, res.Code, res.Body.String())
	require.ErrorIs(t, requestContextErr, context.Canceled)
	require.ErrorIs(t, commandContextErr, context.Canceled)
	require.ErrorIs(t, executorContextErr, context.Canceled)
}

func TestAuthorizerHandlesConcurrentRequests(t *testing.T) {
	const requestCount = 32

	var requestCalls atomic.Int32
	var commandCalls atomic.Int32
	var executorCalls atomic.Int32
	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryJSON: func(context.Context, string, []string) (json.RawMessage, error) {
			executorCalls.Add(1)
			return json.RawMessage(`[]`), nil
		},
	}

	handler := mustHandler(t, spy, WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
		requestCalls.Add(1)
		return func(context.Context, Command) error {
			commandCalls.Add(1)
			return nil
		}, nil
	})))

	statuses := make(chan int, requestCount)
	var wg sync.WaitGroup
	for range requestCount {
		wg.Add(1)
		go func() {
			defer wg.Done()
			req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"json","sql":"SELECT 1"}`))
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
	require.Equal(t, int32(requestCount), requestCalls.Load())
	require.Equal(t, int32(requestCount), commandCalls.Load())
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
				values.Set("type", string(CommandJSON))
				values.Set("sql", sql)
				return httptest.NewRequest(http.MethodGet, "/?"+values.Encode(), nil)
			},
		},
		{
			name: "POST",
			new: func(t *testing.T) *http.Request {
				t.Helper()
				body, err := json.Marshal(map[string]any{
					"type": CommandJSON,
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
			var requestCalls atomic.Int32
			var commandCalls atomic.Int32

			authorizer := AuthorizerFunc(func(r *http.Request) (CommandAuthorizer, error) {
				requestCalls.Add(1)
				require.Equal(t, identity, r.Context().Value(authorizationContextKey{}))

				return func(ctx context.Context, command Command) error {
					commandCalls.Add(1)
					require.Equal(t, identity, ctx.Value(authorizationContextKey{}))
					require.Equal(t, CommandJSON, command.Type())
					require.Equal(t, sql, command.SQL())
					return nil
				}, nil
			})

			handler, err := New(db, WithAuthorizer(authorizer))
			require.NoError(t, err)

			req := tt.new(t)
			req = req.WithContext(context.WithValue(req.Context(), authorizationContextKey{}, identity))
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, req)

			require.Equal(t, http.StatusOK, res.Code, res.Body.String())
			require.Equal(t, int32(1), requestCalls.Load())
			require.Equal(t, int32(1), commandCalls.Load())
		})
	}
}

func TestHTTPCommandAuthorizationStatusMapping(t *testing.T) {
	tests := []struct {
		name       string
		authErr    error
		wantStatus int
		wantBody   string
		secret     string
	}{
		{
			name:       "unauthenticated",
			authErr:    fmt.Errorf("%w: expired credential", ErrUnauthenticated),
			wantStatus: http.StatusUnauthorized,
			wantBody:   "Unauthorized",
		},
		{
			name:       "permission denied",
			authErr:    fmt.Errorf("%w: tenant policy", ErrPermissionDenied),
			wantStatus: http.StatusForbidden,
			wantBody:   "Forbidden",
		},
		{
			name:       "invalid policy command",
			authErr:    fmt.Errorf("%w: unsupported statement", ErrInvalidCommand),
			wantStatus: http.StatusBadRequest,
			wantBody:   "Bad Request",
		},
		{
			name:       "unexpected failure is sanitized",
			authErr:    errors.New("authorization backend failed with bearer super-secret-token"),
			wantStatus: http.StatusInternalServerError,
			wantBody:   "authorization failed",
			secret:     "super-secret-token",
		},
		{
			name:       "canceled request is not logged",
			authErr:    context.Canceled,
			wantStatus: http.StatusInternalServerError,
			wantBody:   "authorization failed",
		},
		{
			name:       "expired deadline is not logged",
			authErr:    context.DeadlineExceeded,
			wantStatus: http.StatusInternalServerError,
			wantBody:   "authorization failed",
		},
	}

	for _, tt := range tests {
		for _, method := range []string{http.MethodGet, http.MethodPost} {
			t.Run(tt.name+"/"+method, func(t *testing.T) {
				var logs bytes.Buffer
				var commandCalls atomic.Int32
				authorizer := AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
					return func(context.Context, Command) error {
						commandCalls.Add(1)
						return tt.authErr
					}, nil
				})

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
				require.Equal(t, tt.wantBody, strings.TrimSpace(res.Body.String()))
				if tt.secret != "" {
					require.NotContains(t, res.Body.String(), tt.secret)
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

func TestHTTPAuthorizerConfigurationFailsClosed(t *testing.T) {
	db := setupTestDB(t)

	t.Run("nil configured authorizer", func(t *testing.T) {
		_, err := New(db, WithAuthorizer(nil))
		require.Error(t, err)
	})

	t.Run("nil function adapter", func(t *testing.T) {
		_, err := New(db, WithAuthorizer(AuthorizerFunc(nil)))
		require.Error(t, err)
	})

	tests := []struct {
		name       string
		authorizer Authorizer
		wantStatus int
		secret     string
	}{
		{
			name: "request rejected as unauthenticated",
			authorizer: AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
				return nil, ErrUnauthenticated
			}),
			wantStatus: http.StatusUnauthorized,
		},
		{
			name: "request authorizer error is sanitized",
			authorizer: AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
				return nil, errors.New("identity provider exposed secret-session-cookie")
			}),
			wantStatus: http.StatusInternalServerError,
			secret:     "secret-session-cookie",
		},
		{
			name: "missing command authorizer",
			authorizer: AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
				return nil, nil
			}),
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := mustHandler(t, failOnCallExecutor{t}, WithAuthorizer(tt.authorizer))

			req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"json","sql":"SELECT 1"}`))
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, req)

			require.Equal(t, tt.wantStatus, res.Code, res.Body.String())
			if tt.secret != "" {
				require.NotContains(t, res.Body.String(), tt.secret)
			}
		})
	}
}

func TestHTTPValidationPrecedesCommandAuthorization(t *testing.T) {
	var commandCalls atomic.Int32
	authorizer := AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
		return func(context.Context, Command) error {
			commandCalls.Add(1)
			return nil
		}, nil
	})

	handler := mustHandler(t, failOnCallExecutor{t}, WithAuthorizer(authorizer))

	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"json"}`))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	require.Equal(t, http.StatusBadRequest, res.Code, res.Body.String())
	require.Zero(t, commandCalls.Load())
}

func TestGenericAuthorizationDoesNotBypassRestrictedExec(t *testing.T) {
	allow := WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
		return func(context.Context, Command) error { return nil }, nil
	}))

	t.Run("function policy", func(t *testing.T) {
		db := setupTestDB(t, query.WithFunctionBlocklist([]string{"md5"}))
		handler, err := New(db, allow)
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"exec","sql":"SELECT 1"}`))
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, req)

		require.Equal(t, http.StatusBadRequest, res.Code, res.Body.String())
		require.Contains(t, res.Body.String(), query.ErrExecWithValidation.Error())
	})

	t.Run("function allowlist policy", func(t *testing.T) {
		db := setupTestDB(t, query.WithFunctionAllowlist(query.FunctionAllowlistOptions{
			DisableDefaults: true,
			Include:         []string{"md5"},
		}))
		handler, err := New(db, allow)
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"exec","sql":"SELECT 1"}`))
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, req)

		require.Equal(t, http.StatusBadRequest, res.Code, res.Body.String())
		require.Contains(t, res.Body.String(), query.ErrExecWithValidation.Error())
	})

	t.Run("schema policy", func(t *testing.T) {
		db := setupTestDB(t)
		handler, err := New(db, allow, WithSchemaMatchHeaders("X-Tenant"))
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"exec","sql":"SELECT 1"}`))
		req.Header.Set("X-Tenant", "tenant_a")
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, req)

		require.Equal(t, http.StatusBadRequest, res.Code, res.Body.String())
		require.Contains(t, res.Body.String(), query.ErrExecWithValidation.Error())
	})
}

func TestWebSocketRequestAuthorizationRejectsBeforeUpgrade(t *testing.T) {
	tests := []struct {
		name       string
		result     func() (CommandAuthorizer, error)
		wantStatus int
		secret     string
	}{
		{
			name: "unauthenticated",
			result: func() (CommandAuthorizer, error) {
				return nil, ErrUnauthenticated
			},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name: "permission denied",
			result: func() (CommandAuthorizer, error) {
				return nil, ErrPermissionDenied
			},
			wantStatus: http.StatusForbidden,
		},
		{
			name: "missing command authorizer",
			result: func() (CommandAuthorizer, error) {
				return nil, nil
			},
			wantStatus: http.StatusInternalServerError,
		},
		{
			name: "unexpected failure is sanitized",
			result: func() (CommandAuthorizer, error) {
				return nil, errors.New("identity service leaked websocket-secret")
			},
			wantStatus: http.StatusInternalServerError,
			secret:     "websocket-secret",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			authorizer := AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
				return tt.result()
			})
			handler := mustHandler(t, failOnCallExecutor{t}, WithAuthorizer(authorizer))
			server := newWebSocketTestServer(t, handler)

			conn, res, dialErr := server.dial(nil)
			require.Error(t, dialErr)
			require.Nil(t, conn)
			require.NotNil(t, res)
			require.Equal(t, tt.wantStatus, res.StatusCode)

			body, readErr := io.ReadAll(res.Body)
			require.NoError(t, readErr)
			require.NoError(t, res.Body.Close())
			if tt.secret != "" {
				require.NotContains(t, string(body), tt.secret)
			}
		})
	}
}

func TestWebSocketAuthorizesEveryMessageAndKeepsConnectionAfterDenial(t *testing.T) {
	const (
		identity   = "websocket-user"
		deniedSQL  = "CREATE TABLE websocket_denied(value INTEGER)"
		allowedSQL = "SELECT 9 AS value /* exact websocket sql */"
	)

	type observation struct {
		requestIdentity any
		commandIdentity any
		typ             CommandType
		sql             string
	}

	db := setupTestDB(t)
	observations := make(chan observation, 2)
	var requestCalls atomic.Int32
	var commandCalls atomic.Int32
	authorizer := AuthorizerFunc(func(r *http.Request) (CommandAuthorizer, error) {
		requestCalls.Add(1)
		requestIdentity := r.Context().Value(authorizationContextKey{})
		return func(ctx context.Context, command Command) error {
			call := commandCalls.Add(1)
			observations <- observation{
				requestIdentity: requestIdentity,
				commandIdentity: ctx.Value(authorizationContextKey{}),
				typ:             command.Type(),
				sql:             command.SQL(),
			}
			if call == 1 {
				return ErrPermissionDenied
			}
			return nil
		}, nil
	})

	baseHandler := mustHandler(t, db, WithAuthorizer(authorizer))
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), authorizationContextKey{}, identity)
		baseHandler.ServeHTTP(w, r.WithContext(ctx))
	})

	server := newWebSocketTestServer(t, handler)
	conn, res, err := server.dial(nil)
	require.NoError(t, err)
	require.NotNil(t, res)
	t.Cleanup(func() {
		require.NoError(t, conn.CloseNow())
	})

	require.NoError(t, wsjson.Write(server.ctx, conn, map[string]any{
		"type": CommandExec,
		"sql":  deniedSQL,
	}))
	var denied struct {
		Error string `json:"error"`
		Code  string `json:"code"`
	}
	require.NoError(t, wsjson.Read(server.ctx, conn, &denied))
	require.NotEmpty(t, denied.Error)
	require.Equal(t, "forbidden", denied.Code)

	// A command denial is an application response, not a connection failure.
	require.NoError(t, wsjson.Write(server.ctx, conn, map[string]any{
		"type": CommandJSON,
		"sql":  allowedSQL,
	}))
	var rows []map[string]int
	require.NoError(t, wsjson.Read(server.ctx, conn, &rows))
	require.Equal(t, []map[string]int{{"value": 9}}, rows)

	require.Equal(t, int32(1), requestCalls.Load())
	require.Equal(t, int32(2), commandCalls.Load())
	first := <-observations
	second := <-observations
	require.Equal(t, observation{
		requestIdentity: identity,
		commandIdentity: identity,
		typ:             CommandExec,
		sql:             deniedSQL,
	}, first)
	require.Equal(t, observation{
		requestIdentity: identity,
		commandIdentity: identity,
		typ:             CommandJSON,
		sql:             allowedSQL,
	}, second)
}

func TestWebSocketCommandAuthorizationErrorMapping(t *testing.T) {
	tests := []struct {
		name        string
		err         error
		wantCode    string
		wantMessage string
		secret      string
	}{
		{name: "invalid command", err: ErrInvalidCommand, wantCode: "bad_request", wantMessage: "Bad Request"},
		{name: "unauthenticated", err: ErrUnauthenticated, wantCode: "unauthenticated", wantMessage: "Unauthorized"},
		{name: "permission denied", err: ErrPermissionDenied, wantCode: "forbidden", wantMessage: "Forbidden"},
		{
			name:        "unexpected failure",
			err:         errors.New("authorization service leaked command-secret"),
			wantCode:    "internal_error",
			wantMessage: "authorization failed",
			secret:      "command-secret",
		},
		{
			name:        "canceled request is not logged",
			err:         context.Canceled,
			wantCode:    "internal_error",
			wantMessage: "authorization failed",
		},
		{
			name:        "expired deadline is not logged",
			err:         context.DeadlineExceeded,
			wantCode:    "internal_error",
			wantMessage: "authorization failed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var logs synchronizedBuffer
			handler := mustHandler(t, failOnCallExecutor{t},
				WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
					return func(context.Context, Command) error { return tt.err }, nil
				})),
				WithLogger(slog.New(slog.NewJSONHandler(&logs, nil))),
			)
			server := newWebSocketTestServer(t, handler)
			conn, _, err := server.dial(nil)
			require.NoError(t, err)
			defer func() {
				require.NoError(t, conn.CloseNow())
			}()

			require.NoError(t, wsjson.Write(server.ctx, conn, map[string]any{
				"type": CommandJSON,
				"sql":  "SELECT 1",
			}))
			var response struct {
				Error string `json:"error"`
				Code  string `json:"code"`
			}
			require.NoError(t, wsjson.Read(server.ctx, conn, &response))
			require.Equal(t, tt.wantCode, response.Code)
			require.Equal(t, tt.wantMessage, response.Error)
			if tt.secret != "" {
				require.NotContains(t, response.Error, tt.secret)
				var record map[string]any
				require.NoError(t, json.Unmarshal(bytes.TrimSpace(logs.Bytes()), &record))
				require.Equal(t, tt.err.Error(), record["error"])
			} else {
				require.Empty(t, logs.Bytes())
			}
		})
	}
}

type synchronizedBuffer struct {
	mu  sync.Mutex
	buf bytes.Buffer
}

func (b *synchronizedBuffer) Write(p []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.Write(p)
}

func (b *synchronizedBuffer) Bytes() []byte {
	b.mu.Lock()
	defer b.mu.Unlock()
	return bytes.Clone(b.buf.Bytes())
}
