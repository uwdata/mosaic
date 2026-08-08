package server

import (
	"context"
	"io"
	"net/http"
	"sync/atomic"
	"testing"

	"github.com/coder/websocket"
	"github.com/stretchr/testify/require"
)

func TestWebSocketOriginPolicyPrecedesAuthorization(t *testing.T) {
	tests := []struct {
		name             string
		options          WebSocketOptions
		origin           func(string) string
		wantAllowed      bool
		wantRequestCalls int32
	}{
		{
			name:             "no origin",
			wantAllowed:      true,
			wantRequestCalls: 1,
		},
		{
			name:             "same host",
			origin:           func(serverURL string) string { return serverURL },
			wantAllowed:      true,
			wantRequestCalls: 1,
		},
		{
			name:             "allowed host pattern",
			options:          WebSocketOptions{AllowedOrigins: []string{"*.example"}},
			origin:           func(string) string { return "https://APP.example" },
			wantAllowed:      true,
			wantRequestCalls: 1,
		},
		{
			name:             "allowed scheme pattern",
			options:          WebSocketOptions{AllowedOrigins: []string{"https://*.example"}},
			origin:           func(string) string { return "https://app.example" },
			wantAllowed:      true,
			wantRequestCalls: 1,
		},
		{
			name:             "allow all",
			options:          WebSocketOptions{AllowAllOrigins: true},
			origin:           func(string) string { return "https://other.example" },
			wantAllowed:      true,
			wantRequestCalls: 1,
		},
		{
			name:        "disallowed origin",
			origin:      func(string) string { return "https://other.example" },
			wantAllowed: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var requestCalls atomic.Int32
			handler := mustHandler(t, failOnCallExecutor{t},
				WithWebSocket(tt.options),
				WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
					requestCalls.Add(1)
					return func(context.Context, Command) error { return nil }, nil
				})),
			)
			server := newWebSocketTestServer(t, handler)

			header := make(http.Header)
			if tt.origin != nil {
				header.Set("Origin", tt.origin(server.httpURL))
			}
			conn, res, err := server.dial(&websocket.DialOptions{HTTPHeader: header})
			if tt.wantAllowed {
				require.NoError(t, err)
				require.NotNil(t, conn)
				require.NotNil(t, res)
				require.Equal(t, http.StatusSwitchingProtocols, res.StatusCode)
				require.NoError(t, conn.Close(websocket.StatusNormalClosure, ""))
			} else {
				require.Error(t, err)
				require.Nil(t, conn)
				require.NotNil(t, res)
				require.Equal(t, http.StatusForbidden, res.StatusCode)
				_, readErr := io.Copy(io.Discard, res.Body)
				require.NoError(t, readErr)
				require.NoError(t, res.Body.Close())
			}
			require.Equal(t, tt.wantRequestCalls, requestCalls.Load())
		})
	}
}
