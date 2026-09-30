package server

import (
	"bytes"
	"context"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/apache/arrow-go/v18/arrow/ipc"
	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extensions"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

func setupTestDB(t *testing.T) *query.DB {
	t.Helper()
	return setupDB(t, nil)
}

func setupConfiguredDB(t *testing.T, configure string, opts ...query.OptionFunc) *query.DB {
	t.Helper()
	return setupDB(t, func(execer driver.ExecerContext) error {
		if err := extensions.InstallAndLoad(t.Context(), execer, "gatekeeper", "community"); err != nil {
			return err
		}
		if configure == "" {
			return nil
		}
		_, err := execer.ExecContext(t.Context(), configure, nil)
		return err
	}, opts...)
}

func setupDB(t *testing.T, init func(driver.ExecerContext) error, opts ...query.OptionFunc) *query.DB {
	t.Helper()
	connector, err := duckdb.NewConnector(":memory:", init)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, connector.Close()) })
	db, err := query.New(t.Context(), connector, opts...)
	require.NoError(t, err)
	t.Cleanup(db.Close)
	return db
}

func mustHandler(t *testing.T, executor commandExecutor, opts ...Option) *handler {
	t.Helper()
	cfg, err := applyOptions(opts)
	require.NoError(t, err)
	return newHandler(executor, cfg)
}

type failOnCallExecutor struct{ testing.TB }

func (e failOnCallExecutor) Exec(context.Context, string) error { return e.fail("Exec") }
func (e failOnCallExecutor) Query(context.Context, string, *query.ValidationPolicy) ([]byte, error) {
	return nil, e.fail("Query")
}
func (e failOnCallExecutor) fail(method string) error {
	e.Helper()
	err := fmt.Errorf("unexpected command executor call: %s", method)
	e.Error(err)
	return err
}

func arrowRows(t *testing.T, data []byte) []map[string]any {
	t.Helper()
	rdr, err := ipc.NewReader(bytes.NewReader(data))
	require.NoError(t, err)
	defer rdr.Release()
	rows := []map[string]any{}
	for rdr.Next() {
		batchJSON, err := rdr.RecordBatch().MarshalJSON()
		require.NoError(t, err)
		var batch []map[string]any
		require.NoError(t, json.Unmarshal(batchJSON, &batch))
		rows = append(rows, batch...)
	}
	require.NoError(t, rdr.Err())
	return rows
}

func TestArrowResponseFraming(t *testing.T) {
	db := setupTestDB(t)
	handler, err := New(db)
	require.NoError(t, err)
	body := `{"type":"arrow","sql":"SELECT 1 AS value"}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	res := httptest.NewRecorder()
	handler.ServeHTTP(res, req)
	require.Equal(t, http.StatusOK, res.Code)
	require.Equal(t, "application/vnd.apache.arrow.stream", res.Header().Get("Content-Type"))
	want := []map[string]any{{"value": float64(1)}}
	require.Equal(t, want, arrowRows(t, res.Body.Bytes()))
}

func TestValidationErrorResponses(t *testing.T) {
	for _, tc := range []struct {
		name   string
		err    error
		status int
		level  string
	}{
		{"denial", query.ErrorDetails{Code: "forbidden", Message: "private-diagnostic"}, 403, "WARN"},
		{"unsupported", query.ErrorDetails{Code: "unsupported", Message: "private-diagnostic"}, 400, "WARN"},
		{"parser", query.ErrorDetails{Code: "parser", Message: "private-diagnostic"}, 400, "WARN"},
		{"binding", query.ErrorDetails{Code: "binding", Message: "private-diagnostic"}, 400, "WARN"},
		{"invalid SQL", query.ErrorDetails{Code: "invalid_input", Message: "private-diagnostic"}, 400, "WARN"},
		{"invalid policy", errors.Join(query.ErrInvalidPolicy, query.ErrorDetails{Code: "invalid_input", Message: "private-diagnostic"}), 500, "ERROR"},
		{"driver failure", errors.New("private-diagnostic"), 500, "ERROR"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var logs bytes.Buffer
			executor := &spyCommandExecutor{failOnCallExecutor: failOnCallExecutor{t},
				queryFn: func(context.Context, string, *query.ValidationPolicy) ([]byte, error) {
					return nil, errors.Join(query.ErrValidation, tc.err)
				},
			}
			handler := mustHandler(t, executor, WithLogger(slog.New(slog.NewJSONHandler(&logs, nil))))
			body := `{"type":"arrow","sql":"SELECT 1"}`
			res := httptest.NewRecorder()
			handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body)))
			require.Equal(t, tc.status, res.Code)
			require.Equal(t, http.StatusText(tc.status)+"\n", res.Body.String())
			var record map[string]any
			require.NoError(t, json.NewDecoder(bytes.NewReader(logs.Bytes())).Decode(&record))
			require.Equal(t, tc.level, record["level"])
			require.Contains(t, record["error"], "private-diagnostic")
		})
	}
}

func TestHandleHTTPQueryParamsErrors(t *testing.T) {
	s := mustHandler(t, failOnCallExecutor{t})
	for _, tc := range []struct{ name, body, want string }{
		{"missing type", `{"sql":"SELECT 1"}`, "missing required 'type' parameter\n"},
		{"invalid type", `{"type":"csv","sql":"SELECT 1"}`, "invalid 'type' parameter: csv\n"},
		{"missing SQL", `{"type":"arrow"}`, "missing required 'sql' parameter\n"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			res := httptest.NewRecorder()
			s.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tc.body)))
			require.Equal(t, http.StatusBadRequest, res.Code)
			require.Equal(t, tc.want, res.Body.String())
		})
	}
}
