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
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

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
