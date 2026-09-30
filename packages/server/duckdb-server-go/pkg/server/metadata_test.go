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
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

type applicationPayload struct {
	Type       string            `json:"type"`
	SQL        string            `json:"sql"`
	ProjectID  uint64            `json:"projectId"`
	Tags       []string          `json:"tags"`
	Attributes map[string]string `json:"attributes"`
}

func TestCommandWorkspaceProjectPayload(t *testing.T) {
	type fields struct {
		WorkspaceID uint64 `json:"workspaceId"`
		ProjectID   uint64 `json:"projectId"`
	}
	t.Run("siblings", func(t *testing.T) {
		const message = `{"type":"arrow","sql":"SELECT 1","workspaceId":123,"projectId":456}`
		want := fields{WorkspaceID: 123, ProjectID: 456}
		t.Run("struct", func(t *testing.T) {
			testCommandPayload(t, http.MethodPost, message, want)
		})
		t.Run("pointer", func(t *testing.T) {
			testCommandPayload(t, http.MethodPost, message, &want)
		})
	})
	t.Run("nested meta", func(t *testing.T) {
		type payload struct {
			Meta fields `json:"meta"`
		}
		const message = `{"type":"arrow","sql":"SELECT 1","meta":{"workspaceId":123,"projectId":456}}`
		want := payload{Meta: fields{WorkspaceID: 123, ProjectID: 456}}
		t.Run("struct", func(t *testing.T) {
			testCommandPayload(t, http.MethodPost, message, want)
		})
		t.Run("pointer", func(t *testing.T) {
			testCommandPayload(t, http.MethodPost, message, &want)
		})
	})
}

func TestCommandTypedPayload(t *testing.T) {
	payloads := []string{
		`{"type":"arrow","sql":"SELECT 1","projectId":9007199254740993,"tags":["one"],"attributes":{"name":"first"},"unrelated":[false,null,1e400]}`,
		`{"type":"arrow","sql":"SELECT 2","projectId":9007199254740995}`,
	}
	commands := make(chan Command[*applicationPayload], len(payloads))
	sqls := make(chan string, len(payloads))
	executor := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryFn: func(_ context.Context, sql string, _ *query.ValidationPolicy) ([]byte, error) {
			sqls <- sql
			return []byte("result"), nil
		},
	}
	handler := mustHandler(t, executor, WithAuthorizer(func(_ *http.Request, command Command[*applicationPayload]) (*query.ValidationPolicy, error) {
		fields := command.Payload()
		require.NotNil(t, fields)
		fields.Type = "exec"
		fields.SQL = "DROP TABLE important"
		commands <- command
		return nil, nil
	}))
	for _, payload := range payloads {
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(payload)))
		require.Equal(t, http.StatusOK, res.Code, res.Body.String())
	}
	require.Len(t, commands, len(payloads))
	require.Len(t, sqls, len(payloads))
	first, second := <-commands, <-commands
	require.Equal(t, CommandArrow, first.Type())
	require.Equal(t, CommandArrow, second.Type())
	require.Equal(t, "SELECT 1", first.SQL())
	require.Equal(t, "SELECT 2", second.SQL())
	require.Equal(t, first.SQL(), <-sqls)
	require.Equal(t, second.SQL(), <-sqls)
	require.Equal(t, uint64(9007199254740993), first.Payload().ProjectID)
	require.Equal(t, uint64(9007199254740995), second.Payload().ProjectID)
	require.Equal(t, []string{"one"}, first.Payload().Tags)
	require.Equal(t, map[string]string{"name": "first"}, first.Payload().Attributes)
	first.Payload().ProjectID = 0
	first.Payload().Tags[0] = "changed"
	first.Payload().Attributes["name"] = "changed"
	require.Equal(t, uint64(9007199254740995), second.Payload().ProjectID)
	require.Nil(t, second.Payload().Tags)
	require.Nil(t, second.Payload().Attributes)
}

type customPayload string

func (p *customPayload) UnmarshalJSON(data []byte) error {
	var fields struct {
		Application *string `json:"application"`
	}
	if err := json.Unmarshal(data, &fields); err != nil {
		return err
	}
	if fields.Application == nil {
		return errors.New("missing private-application-field")
	}
	*p = customPayload(strings.ToUpper(*fields.Application))
	return nil
}

type countedPayload int

func (p *countedPayload) UnmarshalJSON([]byte) error {
	*p++
	return nil
}

func TestCommandDecoderRunsOncePerCommand(t *testing.T) {
	const payload = `{"type":"arrow","sql":"SELECT 1"}`
	testCommandPayload(t, http.MethodPost, payload, countedPayload(1))
	testCommandPayload(t, http.MethodGet, "", countedPayload(0))
}

func TestCommandPayloadTypes(t *testing.T) {
	t.Run("pointer GET", func(t *testing.T) {
		testCommandPayload(t, http.MethodGet, "", (*applicationPayload)(nil))
	})
	t.Run("struct GET", func(t *testing.T) {
		testCommandPayload(t, http.MethodGet, "", applicationPayload{})
	})
	t.Run("custom GET skips decoder", func(t *testing.T) {
		testCommandPayload(t, http.MethodGet, "", customPayload(""))
	})
	t.Run("custom decoder", func(t *testing.T) {
		testCommandPayload(t, http.MethodPost, `{"type":"arrow","sql":"SELECT 1","application":"custom"}`, customPayload("CUSTOM"))
	})
	t.Run("map", func(t *testing.T) {
		testCommandPayload(t, http.MethodPost, `{"type":"arrow","sql":"SELECT 1","application":[null,1e400]}`, map[string]json.RawMessage{
			"type": json.RawMessage(`"arrow"`), "sql": json.RawMessage(`"SELECT 1"`), "application": json.RawMessage(`[null,1e400]`),
		})
	})
	t.Run("no application fields", func(t *testing.T) {
		testCommandPayload(t, http.MethodPost, `{"type":"arrow","sql":"SELECT 1","application":[null,1e400]}`, struct{}{})
	})
}

func testCommandPayload[T any](t *testing.T, method, payload string, want T) {
	t.Helper()
	var calls atomic.Int32
	handler := mustHandler(t, failOnCallExecutor{t}, WithAuthorizer(func(_ *http.Request, command Command[T]) (*query.ValidationPolicy, error) {
		calls.Add(1)
		require.Equal(t, CommandArrow, command.Type())
		require.Equal(t, "SELECT 1", command.SQL())
		require.Equal(t, want, command.Payload())
		return nil, ErrPermissionDenied
	}))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, httptest.NewRequest(method, "/?type=arrow&sql=SELECT+1", strings.NewReader(payload)))
	require.Equal(t, http.StatusForbidden, res.Code, res.Body.String())
	require.Equal(t, int32(1), calls.Load())
}

func TestCommandPayloadDecodeErrors(t *testing.T) {
	for _, tc := range []struct{ payload, want string }{
		{`{"type":"arrow","sql":"SELECT 1","projectId":"private-value"}`, "projectId"},
		{`{"type":"arrow","sql":"SELECT 1","projectId":18446744073709551616}`, "18446744073709551616"},
		{`{"type":"arrow","sql":"SELECT 1","tags":{}}`, "tags"},
	} {
		t.Run(tc.payload, func(t *testing.T) {
			testCommandPayloadDecodeError[*applicationPayload](t, tc.payload, tc.want)
		})
	}
	t.Run("custom decoder", func(t *testing.T) {
		testCommandPayloadDecodeError[customPayload](t, `{"type":"arrow","sql":"SELECT 1"}`, "missing private-application-field")
	})
}

func testCommandPayloadDecodeError[T any](t *testing.T, invalid, want string) {
	t.Helper()
	var calls atomic.Int32
	var logs bytes.Buffer
	handler := mustHandler(t, failOnCallExecutor{t}, WithAuthorizer(func(*http.Request, Command[T]) (*query.ValidationPolicy, error) {
		calls.Add(1)
		return nil, ErrPermissionDenied
	}), WithLogger(slog.New(slog.NewJSONHandler(&logs, nil))))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(invalid)))
	require.Equal(t, http.StatusBadRequest, res.Code)
	require.Contains(t, res.Body.String(), "server: invalid command: decode command payload: ")
	require.Contains(t, res.Body.String(), want)
	require.Zero(t, calls.Load())
	var diagnostic map[string]any
	require.NoError(t, json.Unmarshal(logs.Bytes(), &diagnostic))
	require.Equal(t, "WARN", diagnostic["level"])
	require.Contains(t, diagnostic["error"], want)
}

func TestCommandRawMessagePayload(t *testing.T) {
	payloads := []string{
		`{"type":"arrow","sql":"SELECT 1"}`,
		" \n" + `{"type":"arrow","sql":"SELECT 1","label":"a\u0062","list":[true,false,null,{},[]],"object":{"n":9007199254740993},"number":1e400}` + "\t\r\n",
		`{"type":"arrow","sql":"SELECT 1","metadata":null,"metadata":[1,"two"],"raw":false,"label":42,"label":{"x":1}}`,
		`{"type":"exec","TYPE":"arrow","sql":"SELECT 0","SQL":"SELECT 1","name":"custom"}`,
	}

	commands := make(chan Command[json.RawMessage], len(payloads))
	sqls := make(chan string, len(payloads))
	executor := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryFn: func(_ context.Context, sql string, _ *query.ValidationPolicy) ([]byte, error) {
			sqls <- sql
			return []byte("result"), nil
		},
	}
	handler := mustHandler(t, executor, WithAuthorizer(func(_ *http.Request, command Command[json.RawMessage]) (*query.ValidationPolicy, error) {
		commands <- command
		return nil, nil
	}))

	for _, payload := range payloads {
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(payload)))
		require.Equal(t, http.StatusOK, res.Code, res.Body.String())
	}

	require.Len(t, commands, len(payloads))
	require.Len(t, sqls, len(payloads))
	for _, payload := range payloads {
		command := <-commands
		require.Equal(t, CommandArrow, command.Type())
		require.Equal(t, "SELECT 1", command.SQL())
		require.Equal(t, command.SQL(), <-sqls)
		require.Equal(t, strings.TrimSpace(payload), string(command.Payload()))
		clear(command.Payload())
		require.Equal(t, CommandArrow, command.Type())
		require.Equal(t, "SELECT 1", command.SQL())
	}
}

func TestCommandRawMessageGET(t *testing.T) {
	var seen Command[json.RawMessage]
	handler := mustHandler(t, failOnCallExecutor{t}, WithMaxBytes(1), WithAuthorizer(func(r *http.Request, command Command[json.RawMessage]) (*query.ValidationPolicy, error) {
		require.Equal(t, []string{"one", "two"}, r.URL.Query()["label"])
		seen = command
		return nil, ErrPermissionDenied
	}))
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/?type=arrow&sql=SELECT+1&label=one&label=two", nil)
	handler.ServeHTTP(res, req)

	require.Equal(t, http.StatusForbidden, res.Code)
	require.Equal(t, CommandArrow, seen.Type())
	require.Equal(t, "SELECT 1", seen.SQL())
	require.Nil(t, seen.Payload())
}

func TestCommandPayloadErrors(t *testing.T) {
	const decode = "server: invalid command: decode request body: "
	tests := []struct {
		name    string
		payload string
		want    string
	}{
		{"empty", "", decode},
		{"malformed", `{`, decode},
		{"trailing data", `{"type":"arrow","sql":"SELECT 1"} trailing`, decode},
		{"second value", `{"type":"arrow","sql":"SELECT 1"} {}`, decode},
		{"array", `[]`, decode},
		{"wrong sql type", `{"type":"arrow","sql":42}`, decode},
		{"wrong name type", `{"type":"arrow","sql":"SELECT 1","name":{}}`, decode},
		{"missing sql", `{"type":"arrow"}`, "missing required 'sql' parameter"},
		{"null sql", `{"type":"arrow","sql":"SELECT 1","sql":null}`, "missing required 'sql' parameter"},
		{"removed json type", `{"type":"json","sql":"SELECT 1"}`, "invalid 'type' parameter: json"},
		{"unknown type", `{"type":"other","sql":"SELECT 1"}`, "invalid 'type' parameter: other"},
		{"null", `null`, "missing required 'type' parameter"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var commandCalls atomic.Int32
			handler := mustHandler(t, failOnCallExecutor{t}, WithAuthorizer(func(*http.Request, Command[json.RawMessage]) (*query.ValidationPolicy, error) {
				commandCalls.Add(1)
				return nil, ErrPermissionDenied
			}))
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.payload)))
			require.Equal(t, http.StatusBadRequest, res.Code, res.Body.String())
			require.True(t, strings.HasPrefix(res.Body.String(), tt.want), res.Body.String())
			require.Zero(t, commandCalls.Load())
		})
	}
}

func TestCommandBodyLimits(t *testing.T) {
	tests := []struct {
		name  string
		limit int64
		size  int
	}{
		{"unbounded", 0, 32769},
		{"configured exact", 128, 128},
		{"configured over", 128, 129},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payload := `{"type":"arrow","sql":"SELECT 1","payload":""}`
			payload = strings.Replace(payload, `"payload":""`, `"payload":"`+strings.Repeat("x", tt.size-len(payload))+`"`, 1)
			commands := make(chan Command[json.RawMessage], 1)
			var executorCalls atomic.Int32
			var expectedCalls int32
			executor := &spyCommandExecutor{
				failOnCallExecutor: failOnCallExecutor{t},
				queryFn: func(context.Context, string, *query.ValidationPolicy) ([]byte, error) {
					executorCalls.Add(1)
					return []byte("result"), nil
				},
			}
			opts := []Option{WithAuthorizer(func(_ *http.Request, command Command[json.RawMessage]) (*query.ValidationPolicy, error) {
				commands <- command
				return nil, nil
			})}
			if tt.limit > 0 {
				opts = append(opts, WithMaxBytes(tt.limit))
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
				require.Equal(t, payload, string((<-commands).Payload()))
				expectedCalls++
			}

			require.Equal(t, expectedCalls, executorCalls.Load())
		})
	}
}

func TestHTTPBodyLimitCoversGet(t *testing.T) {
	var logs bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&logs, nil))
	var seen int
	handler := mustHandler(t, failOnCallExecutor{t}, WithMaxBytes(16), WithLogger(logger), WithAuthorizer(func(r *http.Request, _ Command[struct{}]) (*query.ValidationPolicy, error) {
		body, err := io.ReadAll(r.Body)
		seen = len(body)
		if err != nil {
			return nil, err
		}
		t.Error("unexpected complete body read")
		return nil, ErrPermissionDenied
	}))
	req := httptest.NewRequest(http.MethodGet, "/?type=arrow&sql=SELECT+1", bytes.NewReader(make([]byte, 4096)))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	require.Equal(t, http.StatusRequestEntityTooLarge, res.Code)
	require.Equal(t, 16, seen)
	require.Contains(t, logs.String(), `"limit":16`)
}

func TestHTTPBodyLimitClosesConnection(t *testing.T) {
	server := httptest.NewServer(mustHandler(t, failOnCallExecutor{t}, WithMaxBytes(1)))
	t.Cleanup(server.Close)
	res, err := server.Client().Post(server.URL, "application/json", strings.NewReader(`{"type":"arrow","sql":"SELECT 1"}`))
	require.NoError(t, err)
	require.NoError(t, res.Body.Close())
	require.Equal(t, http.StatusRequestEntityTooLarge, res.StatusCode)
	require.True(t, res.Close)
}

func TestHTTPBodyLimitLogsLimit(t *testing.T) {
	var logs bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&logs, nil))
	handler := mustHandler(t, failOnCallExecutor{t}, WithMaxBytes(1), WithLogger(logger))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"secret":"private-payload"}`)))
	require.Equal(t, http.StatusRequestEntityTooLarge, res.Code)
	var record map[string]any
	require.NoError(t, json.Unmarshal(logs.Bytes(), &record))
	require.Equal(t, "WARN", record["level"])
	require.Equal(t, float64(1), record["limit"])
	require.NotContains(t, logs.String(), "private-payload")
}
