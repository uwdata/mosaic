package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/require"
)

type spyCommandExecutor struct {
	failOnCallExecutor
	exec       func(context.Context, string) error
	queryArrow func(context.Context, string, []string, bool) ([]byte, bool, error)
	queryJSON  func(context.Context, string, []string, bool) (json.RawMessage, bool, error)
}

func (s *spyCommandExecutor) Exec(ctx context.Context, sql string) error {
	if s.exec == nil {
		return s.failOnCallExecutor.Exec(ctx, sql)
	}
	return s.exec(ctx, sql)
}

func (s *spyCommandExecutor) QueryArrow(ctx context.Context, sql string, schemas []string, persist bool) ([]byte, bool, error) {
	if s.queryArrow == nil {
		return s.failOnCallExecutor.QueryArrow(ctx, sql, schemas, persist)
	}
	return s.queryArrow(ctx, sql, schemas, persist)
}

func (s *spyCommandExecutor) QueryJSON(ctx context.Context, sql string, schemas []string, persist bool) (json.RawMessage, bool, error) {
	if s.queryJSON == nil {
		return s.failOnCallExecutor.QueryJSON(ctx, sql, schemas, persist)
	}
	return s.queryJSON(ctx, sql, schemas, persist)
}

func TestCommandDenialPrecedesExecutorAndCacheBoundary(t *testing.T) {
	var executorCalls int
	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		exec: func(context.Context, string) error {
			executorCalls++
			return nil
		},
		queryArrow: func(context.Context, string, []string, bool) ([]byte, bool, error) {
			executorCalls++
			return nil, false, nil
		},
		queryJSON: func(context.Context, string, []string, bool) (json.RawMessage, bool, error) {
			executorCalls++
			return json.RawMessage(`[]`), true, nil
		},
	}

	handler := mustHandler(t, spy, WithAuthorizer(AuthorizerFunc(func(*http.Request) (CommandAuthorizer, error) {
		return func(context.Context, Command) error {
			return ErrPermissionDenied
		}, nil
	})))

	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"json","sql":"SELECT * FROM sensitive_data","persist":true}`))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	require.Equal(t, http.StatusForbidden, res.Code, res.Body.String())
	require.Zero(t, executorCalls, "denial must occur before query validation, cache lookup, or database execution")
}

func TestCommandAuthorizationRunsImmediatelyBeforeExecutor(t *testing.T) {
	const sql = "SELECT 1 AS value"

	var mu sync.Mutex
	var events []string
	appendEvent := func(event string) {
		mu.Lock()
		defer mu.Unlock()
		events = append(events, event)
	}

	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryJSON: func(_ context.Context, gotSQL string, schemas []string, persist bool) (json.RawMessage, bool, error) {
			appendEvent("executor")
			require.Equal(t, sql, gotSQL)
			require.Empty(t, schemas)
			require.True(t, persist)
			return json.RawMessage(`[{"value":1}]`), false, nil
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

	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"json","sql":"SELECT 1 AS value","persist":true}`))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)

	require.Equal(t, http.StatusOK, res.Code, res.Body.String())
	require.JSONEq(t, `[{"value":1}]`, res.Body.String())
	mu.Lock()
	defer mu.Unlock()
	require.Equal(t, []string{"authorize", "executor"}, events)
}

func TestCanceledRequestContextReachesAuthorizationAndExecutor(t *testing.T) {
	var requestContextErr error
	var commandContextErr error
	var executorContextErr error

	spy := &spyCommandExecutor{
		failOnCallExecutor: failOnCallExecutor{t},
		queryJSON: func(ctx context.Context, _ string, _ []string, _ bool) (json.RawMessage, bool, error) {
			executorContextErr = ctx.Err()
			return json.RawMessage(`[]`), false, nil
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
		queryJSON: func(context.Context, string, []string, bool) (json.RawMessage, bool, error) {
			executorCalls.Add(1)
			return json.RawMessage(`[]`), false, nil
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
