package server

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
	"github.com/stretchr/testify/require"
)

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

func websocketTestURL(httpURL string) string {
	return "ws" + strings.TrimPrefix(httpURL, "http")
}

type webSocketTestServer struct {
	ctx     context.Context
	httpURL string
	url     string
}

func newWebSocketTestServer(t *testing.T, handler http.Handler) *webSocketTestServer {
	t.Helper()

	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	ctx, cancel := context.WithTimeout(t.Context(), 5*time.Second)
	t.Cleanup(cancel)
	return &webSocketTestServer{
		ctx:     ctx,
		httpURL: server.URL,
		url:     websocketTestURL(server.URL),
	}
}

func (s *webSocketTestServer) dial(options *websocket.DialOptions) (*websocket.Conn, *http.Response, error) {
	return websocket.Dial(s.ctx, s.url, options)
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
