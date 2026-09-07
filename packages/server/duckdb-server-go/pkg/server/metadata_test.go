package server

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
	"github.com/stretchr/testify/require"
)

func TestCommandRawEnvelope(t *testing.T) {
	payloads := []string{
		`{"type":"json","sql":"SELECT 1"}`,
		" \n" + `{"type":"json","sql":"SELECT 1","label":"a\u0062","list":[true,false,null,{},[]],"object":{"n":9007199254740993},"number":1e400}` + "\t\r\n",
		`{"type":"json","sql":"SELECT 1","metadata":null,"metadata":[1,"two"],"raw":false,"label":42,"label":{"x":1}}`,
		`{"type":"exec","TYPE":"json","sql":"SELECT 0","SQL":"SELECT 1","name":"custom"}`,
	}

	for _, transport := range []string{"HTTP", "WebSocket"} {
		t.Run(transport, func(t *testing.T) {
			commands := make(chan Command, len(payloads))
			sqls := make(chan string, len(payloads))
			executor := &spyCommandExecutor{
				failOnCallExecutor: failOnCallExecutor{t},
				queryJSON: func(_ context.Context, sql string, _ []string) (json.RawMessage, error) {
					sqls <- sql
					return json.RawMessage(`[]`), nil
				},
			}
			handler := mustHandler(t, executor, WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
				return func(_ context.Context, command Command) error {
					commands <- command
					clear(command.Raw())
					return nil
				}, nil
			})))

			var conn *websocket.Conn
			ctx := t.Context()
			if transport == "WebSocket" {
				server := newWebSocketTestServer(t, handler)
				ctx = server.ctx
				var err error
				conn, _, err = server.dial(nil)
				require.NoError(t, err)
				t.Cleanup(func() { require.NoError(t, conn.CloseNow()) })
			}
			for _, payload := range payloads {
				if conn == nil {
					res := httptest.NewRecorder()
					handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(payload)))
					require.Equal(t, http.StatusOK, res.Code, res.Body.String())
				} else {
					require.NoError(t, conn.Write(ctx, websocket.MessageText, []byte(payload)))
					_, response, err := conn.Read(ctx)
					require.NoError(t, err)
					require.JSONEq(t, `[]`, string(response))
				}
			}

			require.Len(t, commands, len(payloads))
			require.Len(t, sqls, len(payloads))
			for _, payload := range payloads {
				command := <-commands
				require.Equal(t, CommandJSON, command.Type())
				require.Equal(t, "SELECT 1", command.SQL())
				require.Equal(t, command.SQL(), <-sqls)
				require.Equal(t, payload, string(command.Raw()))
				clear(command.Raw())
				require.Equal(t, payload, string(command.Raw()))
			}
		})
	}
}

func TestCommandRawGET(t *testing.T) {
	var seen Command
	handler := mustHandler(t, failOnCallExecutor{t}, WithMaxMessageBytes(1), WithAuthorizer(AuthorizerFunc(func(r *http.Request) (CommandAuthorizer, error) {
		require.Equal(t, []string{"one", "two"}, r.URL.Query()["label"])
		return func(_ context.Context, command Command) error {
			seen = command
			return ErrPermissionDenied
		}, nil
	})))
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/?type=json&sql=SELECT+1&label=one&label=two", nil)
	handler.ServeHTTP(res, req)

	require.Equal(t, http.StatusForbidden, res.Code)
	require.Equal(t, CommandJSON, seen.Type())
	require.Equal(t, "SELECT 1", seen.SQL())
	require.Nil(t, seen.Raw())
}

func TestCommandPayloadErrors(t *testing.T) {
	tests := []struct {
		name    string
		payload string
		close   bool
	}{
		{"empty", "", true},
		{"malformed", `{`, true},
		{"trailing data", `{"type":"json","sql":"SELECT 1"} trailing`, true},
		{"second value", `{"type":"json","sql":"SELECT 1"} {}`, true},
		{"array", `[]`, true},
		{"wrong sql type", `{"type":"json","sql":42}`, true},
		{"wrong name type", `{"type":"json","sql":"SELECT 1","name":{}}`, true},
		{"missing sql", `{"type":"json"}`, false},
		{"null sql", `{"type":"json","sql":"SELECT 1","sql":null}`, false},
		{"unknown type", `{"type":"other","sql":"SELECT 1"}`, false},
		{"null", `null`, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var commandCalls atomic.Int32
			handler := mustHandler(t, failOnCallExecutor{t}, WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
				return func(context.Context, Command) error {
					commandCalls.Add(1)
					return ErrPermissionDenied
				}, nil
			})))
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.payload)))
			require.Equal(t, http.StatusBadRequest, res.Code, res.Body.String())
			require.Zero(t, commandCalls.Load())

			server := newWebSocketTestServer(t, handler)
			conn, _, err := server.dial(nil)
			require.NoError(t, err)
			t.Cleanup(func() {
				if err := conn.CloseNow(); !errors.Is(err, net.ErrClosed) {
					require.NoError(t, err)
				}
			})
			require.NoError(t, conn.Write(server.ctx, websocket.MessageText, []byte(tt.payload)))
			_, response, err := conn.Read(server.ctx)
			if tt.close {
				require.Equal(t, websocket.StatusInvalidFramePayloadData, websocket.CloseStatus(err), "%v", err)
			} else {
				require.NoError(t, err)
				var rejection map[string]string
				require.NoError(t, json.Unmarshal(response, &rejection))
				require.Equal(t, "bad_request", rejection["code"])
			}
			require.Zero(t, commandCalls.Load())
			if !tt.close {
				require.NoError(t, conn.Write(server.ctx, websocket.MessageText, []byte(`{"type":"json","sql":"SELECT 1"}`)))
				var rejection map[string]string
				require.NoError(t, wsjson.Read(server.ctx, conn, &rejection))
				require.Equal(t, "forbidden", rejection["code"])
				require.Equal(t, int32(1), commandCalls.Load())
			}
		})
	}
}

func TestCommandMessageLimits(t *testing.T) {
	tests := []struct {
		name       string
		limit      int64
		size       int
		compressed bool
	}{
		{"default exact", 0, 32768, false},
		{"default over", 0, 32769, false},
		{"configured exact", 128, 128, false},
		{"configured over", 128, 129, false},
		{"larger than default", 65536, 65536, false},
		{"compressed exact", 128, 128, true},
		{"compressed over", 128, 129, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payload := `{"type":"json","sql":"SELECT 1","payload":""}`
			payload = strings.Replace(payload, `"payload":""`, `"payload":"`+strings.Repeat("x", tt.size-len(payload))+`"`, 1)
			commands := make(chan Command, 2)
			var executorCalls atomic.Int32
			var expectedCalls int32
			executor := &spyCommandExecutor{
				failOnCallExecutor: failOnCallExecutor{t},
				queryJSON: func(context.Context, string, []string) (json.RawMessage, error) {
					executorCalls.Add(1)
					return json.RawMessage(`[]`), nil
				},
			}
			var requestCalls atomic.Int32
			opts := []Option{WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
				requestCalls.Add(1)
				return func(_ context.Context, command Command) error {
					commands <- command
					return nil
				}, nil
			}))}
			if tt.limit > 0 {
				opts = append(opts, WithMaxMessageBytes(tt.limit))
			}
			handler := mustHandler(t, executor, opts...)
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(payload)))
			if tt.limit > 0 && int64(tt.size) > tt.limit {
				require.Equal(t, http.StatusRequestEntityTooLarge, res.Code)
				require.Empty(t, commands)
			} else {
				require.Equal(t, http.StatusOK, res.Code, res.Body.String())
				require.Len(t, commands, 1)
				require.Equal(t, payload, string((<-commands).Raw()))
				expectedCalls++
			}

			server := newWebSocketTestServer(t, handler)
			dialOptions := &websocket.DialOptions{}
			if tt.compressed {
				dialOptions.CompressionMode = websocket.CompressionContextTakeover
				dialOptions.CompressionThreshold = 1
			}
			conn, upgrade, err := server.dial(dialOptions)
			require.NoError(t, err)
			t.Cleanup(func() {
				if err := conn.CloseNow(); !errors.Is(err, net.ErrClosed) {
					require.NoError(t, err)
				}
			})
			if tt.compressed {
				require.Contains(t, upgrade.Header.Get("Sec-WebSocket-Extensions"), "permessage-deflate")
			}
			require.NoError(t, conn.Write(server.ctx, websocket.MessageText, []byte(payload)))
			_, response, err := conn.Read(server.ctx)
			wsLimit := tt.limit
			if wsLimit == 0 {
				wsLimit = 32768
			}
			if int64(tt.size) > wsLimit {
				require.Equal(t, websocket.StatusMessageTooBig, websocket.CloseStatus(err), "%v", err)
				require.Empty(t, commands)
			} else {
				require.NoError(t, err)
				require.JSONEq(t, `[]`, string(response))
				require.Len(t, commands, 1)
				require.Equal(t, payload, string((<-commands).Raw()))
				expectedCalls++
			}
			require.Equal(t, int32(2), requestCalls.Load())
			require.Equal(t, expectedCalls, executorCalls.Load())
		})
	}
}

func TestHTTPMessageLimitFollowsRequestAuthorization(t *testing.T) {
	const payload = `{"type":"json","sql":"SELECT 1","application":[null,42]}`
	for _, tt := range []struct {
		name   string
		denied bool
	}{{"restore body", false}, {"reject request", true}} {
		t.Run(tt.name, func(t *testing.T) {
			handler := mustHandler(t, failOnCallExecutor{t}, WithMaxMessageBytes(1), WithAuthorizer(AuthorizerFunc(func(r *http.Request) (CommandAuthorizer, error) {
				if tt.denied {
					return nil, ErrUnauthenticated
				}
				body, err := io.ReadAll(r.Body)
				require.NoError(t, err)
				require.Equal(t, payload, string(body))
				r.Body = io.NopCloser(strings.NewReader(string(body)))
				return func(context.Context, Command) error {
					t.Error("unexpected command authorization")
					return ErrPermissionDenied
				}, nil
			})))
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(payload)))
			if tt.denied {
				require.Equal(t, http.StatusUnauthorized, res.Code)
			} else {
				require.Equal(t, http.StatusRequestEntityTooLarge, res.Code)
			}
		})
	}
}
