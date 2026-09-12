package query

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/require"
)

func TestValidationPoolIsolation(t *testing.T) {
	db := setupTestDB(t, WithMaxConnections(4))
	var wg sync.WaitGroup
	errs := make(chan error, 16)
	for worker := range 16 {
		wg.Go(func() {
			for iteration := range 12 {
				schema := fmt.Sprintf("tenant_%d", worker)
				policy := ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{schema}, CheckFunctions: true, AllowedFunctions: []string{"md5"}}
				query := "SELECT md5('x') FROM " + schema + ".t"
				deny := iteration%2 == 1
				if deny {
					policy.AllowedFunctions = nil
				}
				err := db.ValidateSQL(t.Context(), query, policy)
				if (deny && !errors.Is(err, ErrAccessDenied)) || (!deny && err != nil) {
					errs <- fmt.Errorf("worker %d iteration %d: %v", worker, iteration, err)
					return
				}
				policy.AllowedSchemas = []string{"another_tenant"}
				if err := db.ValidateSQL(t.Context(), query, policy); !errors.Is(err, ErrAccessDenied) {
					errs <- fmt.Errorf("worker %d schema leaked: %v", worker, err)
					return
				}
			}
		})
	}
	wg.Wait()
	close(errs)
	for err := range errs {
		require.NoError(t, err)
	}
	require.LessOrEqual(t, db.validationDB.Stats().OpenConnections, 4)
}

func TestValidationPoolCancellationAndExpansion(t *testing.T) {
	connector, err := duckdb.NewConnector(":memory:", nil)
	require.NoError(t, err)
	defer connector.Close()
	ctx, cancel := context.WithCancel(t.Context())
	db, err := New(ctx, connector, WithMaxConnections(2))
	require.NoError(t, err)
	defer db.Close()
	cancel()
	first, err := db.validationDB.Conn(t.Context())
	require.NoError(t, err)
	defer first.Close()
	require.NoError(t, db.ValidateSQL(t.Context(), "SELECT 1", ValidationPolicy{}))
	require.Equal(t, 2, db.validationDB.Stats().OpenConnections)
	require.ErrorIs(t, db.ValidateSQL(ctx, "SELECT 1", ValidationPolicy{}), context.Canceled)
	require.Error(t, db.ValidateSQL(t.Context(), "SELECT * FROM", ValidationPolicy{}))
	require.NoError(t, db.ValidateSQL(t.Context(), "SELECT 1", ValidationPolicy{}))
}

func TestValidationPoolCatalogIsolation(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, db.Exec(t.Context(), `
		CREATE TABLE validation_input(query VARCHAR);
		CREATE TABLE validation_rules(kind VARCHAR);
		CREATE MACRO json_serialize_sql(sql_text, skip_default := true, skip_empty := true, skip_null := true) AS {'error': false, 'statements': []};
		PREPARE validation AS SELECT 'ok' AS code;
	`))
	err := db.ValidateSQL(t.Context(), "SELECT * FROM tenant_b.secret", ValidationPolicy{CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}})
	require.ErrorIs(t, err, ErrAccessDenied)
	var value string
	require.NoError(t, db.db.QueryRowContext(t.Context(), "SELECT current_setting('threads')::VARCHAR").Scan(&value))
	require.NoError(t, db.Exec(t.Context(), "SET threads=2"))
	var validationThreads string
	require.NoError(t, db.validationDB.QueryRowContext(t.Context(), "SELECT current_setting('threads')::VARCHAR").Scan(&validationThreads))
	require.Equal(t, "1", validationThreads)
	require.NoError(t, db.db.QueryRowContext(t.Context(), "SELECT current_setting('threads')::VARCHAR").Scan(&value))
	require.Equal(t, "2", value)
}

func TestValidationPoolMatchesStandalone(t *testing.T) {
	db := setupTestDB(t)
	for _, policy := range []ValidationPolicy{
		{}, {CheckSchemas: true, AllowedSchemas: []string{"tenant_a"}},
		{CheckFunctions: true, AllowedFunctions: []string{"sum", "range"}},
		{BlockedFunctions: []string{"md5"}}, {RejectRemoteURILiterals: true},
	} {
		for _, query := range []string{
			"SELECT 1", "SELECT * FROM tenant_a.t", "SELECT * FROM tenant_b.t", "SELECT * FROM t",
			"SELECT md5('x'), md5('y')", "SELECT sum(i) OVER () FROM range(3) t(i)",
			"WITH t AS (SELECT 1) SELECT * FROM t", "WITH t AS (SELECT * FROM t) SELECT * FROM t",
			"SELECT * FROM read_parquet('s3://bucket/file')", "SELECT * FROM query('SELECT 1')",
			"DROP TABLE t", "SELECT * FROM",
		} {
			want := db.validateSQL(t.Context(), validationSQL, query, policy)
			got := db.ValidateSQL(t.Context(), query, policy)
			if want == nil {
				require.NoError(t, got, query)
			} else {
				require.EqualError(t, got, want.Error(), query)
			}
		}
	}
}
