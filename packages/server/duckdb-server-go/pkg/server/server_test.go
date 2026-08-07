package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

func setupTestDB(t *testing.T, opts ...query.OptionFunc) *query.DB {
	t.Helper()

	connector, err := duckdb.NewConnector(":memory:", nil)
	require.NoError(t, err)

	db, err := query.New(t.Context(), connector, opts...)
	require.NoError(t, err)
	t.Cleanup(func() {
		db.Close()
		require.NoError(t, connector.Close())
	})
	return db
}

func TestExecCommandHonorsSchemaPolicy(t *testing.T) {
	db := setupTestDB(t)

	command := CommandExec
	sql := "SELECT 1"
	params := QueryParams{Type: &command, SQL: &sql}

	s := New(db, []string{"X-Tenant"}, nil)
	_, _, err := s.execCommand(t.Context(), params, nil)
	require.ErrorIs(t, err, query.ErrExecWithValidation)

	s = New(db, nil, nil)
	_, _, err = s.execCommand(t.Context(), params, nil)
	require.NoError(t, err)
}

func TestHandleHTTPPolicyErrors(t *testing.T) {
	t.Run("blocked function is forbidden", func(t *testing.T) {
		db := setupTestDB(t, query.WithFunctionBlocklist([]string{"md5"}))
		s := New(db, nil, nil)
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"json","sql":"SELECT md5('mosaic')"}`))
		res := httptest.NewRecorder()

		s.ServeHTTP(res, req)

		require.Equal(t, http.StatusForbidden, res.Code)
		require.Contains(t, res.Body.String(), "use of function 'md5' is not allowed")
	})

	t.Run("unauthorized schema is forbidden", func(t *testing.T) {
		db := setupTestDB(t)
		require.NoError(t, db.Exec(t.Context(), "CREATE SCHEMA tenant_a; CREATE TABLE tenant_a.secret (value INTEGER)"))

		s := New(db, []string{"X-Tenant"}, nil)
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"json","sql":"SELECT * FROM tenant_a.secret"}`))
		req.Header.Set("X-Tenant", "tenant_b")
		res := httptest.NewRecorder()

		s.ServeHTTP(res, req)

		require.Equal(t, http.StatusForbidden, res.Code)
		require.Contains(t, res.Body.String(), "unauthorized access to schema")
	})

	t.Run("exec under schema policy is a bad request", func(t *testing.T) {
		db := setupTestDB(t)
		s := New(db, []string{"X-Tenant"}, nil)
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"exec","sql":"SELECT 1"}`))
		req.Header.Set("X-Tenant", "tenant_a")
		res := httptest.NewRecorder()

		s.ServeHTTP(res, req)

		require.Equal(t, http.StatusBadRequest, res.Code)
		require.Equal(t, query.ErrExecWithValidation.Error()+"\n", res.Body.String())
	})

	t.Run("unsupported statement under policy is a bad request", func(t *testing.T) {
		db := setupTestDB(t, query.WithFunctionBlocklist([]string{"md5"}))
		s := New(db, nil, nil)
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"json","sql":"PRAGMA version"}`))
		res := httptest.NewRecorder()

		s.ServeHTTP(res, req)

		require.Equal(t, http.StatusBadRequest, res.Code)
		require.Contains(t, res.Body.String(), "query: validation failed: query: not implemented: Only SELECT statements can be serialized to json")
		require.NotContains(t, res.Body.String(), "()")
		require.NotContains(t, res.Body.String(), " at :")
	})

	t.Run("syntax error under policy is a bad request", func(t *testing.T) {
		db := setupTestDB(t, query.WithFunctionBlocklist([]string{"md5"}))
		s := New(db, nil, nil)
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"json","sql":"SELECT ("}`))
		res := httptest.NewRecorder()

		s.ServeHTTP(res, req)

		require.Equal(t, http.StatusBadRequest, res.Code)
		require.Contains(t, res.Body.String(), "query: parser")
	})

	t.Run("missing schema header is unauthorized", func(t *testing.T) {
		db := setupTestDB(t)
		s := New(db, []string{"X-Tenant"}, nil)
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"type":"exec","sql":"SELECT 1"}`))
		res := httptest.NewRecorder()

		s.ServeHTTP(res, req)

		require.Equal(t, http.StatusUnauthorized, res.Code)
	})
}

func TestHandleHTTPQueryParamsErrors(t *testing.T) {
	db := setupTestDB(t)
	s := New(db, nil, nil)

	tests := []struct {
		name     string
		body     string
		wantBody string
	}{
		{
			name:     "missing type",
			body:     `{"sql":"SELECT 1"}`,
			wantBody: "missing required 'type' parameter\n",
		},
		{
			name:     "invalid type",
			body:     `{"type":"csv","sql":"SELECT 1"}`,
			wantBody: "invalid 'type' parameter: csv\n",
		},
		{
			name:     "missing SQL",
			body:     `{"type":"json"}`,
			wantBody: "missing required 'sql' parameter\n",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.body))
			res := httptest.NewRecorder()

			s.ServeHTTP(res, req)

			require.Equal(t, http.StatusBadRequest, res.Code)
			require.Equal(t, tt.wantBody, res.Body.String())
		})
	}
}

func TestGetAllowedSchemasTrimsHeaderNames(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Tenant-Id", "tenant_a")
	req.Header.Set("Verified-User-Id", "user_a")

	got := getAllowedSchemas(req, []string{" X-Tenant-Id ", "\tVerified-User-Id "})
	require.Equal(t, []string{"tenant_a", "user_a"}, got)
	require.Empty(t, getAllowedSchemas(req, []string{" "}))
}
