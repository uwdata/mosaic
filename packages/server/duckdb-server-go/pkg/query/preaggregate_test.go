package query

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func setupPreAggregator(t *testing.T, limits PreAggregateLimits) (*DB, *PreAggregator, PreAggregateScope) {
	t.Helper()
	db := setupTestDB(t, WithFunctionAllowlist(FunctionAllowlistOptions{}))
	_, err := db.db.ExecContext(t.Context(), `CREATE SCHEMA tenant;
CREATE TABLE tenant.source AS SELECT * FROM (VALUES ('a'), ('b'), ('b')) t(dim)`)
	require.NoError(t, err)
	p, err := NewPreAggregator(t.Context(), db, "", limits)
	require.NoError(t, err)
	return db, p, PreAggregateScope{Key: "tenant:reader:v1", Sources: []PreAggregateNamespace{{"memory", "tenant"}}}
}

func TestPreAggregateMaterialize(t *testing.T) {
	db, p, scope := setupPreAggregator(t, PreAggregateLimits{})
	source := `SELECT dim, count(*) AS n FROM memory.tenant.source GROUP BY dim`
	first, err := p.Materialize(t.Context(), scope, source)
	require.NoError(t, err)
	ref := p.reference(scope.Key, source)
	require.Equal(t, "memory", first.Catalog)
	require.False(t, first.CreatedAt.IsZero())
	again, err := p.Materialize(t.Context(), scope, source)
	require.NoError(t, err)
	require.Equal(t, first, again)

	var authorized []string
	data, err := p.QueryArrow(t.Context(), scope, "SELECT * FROM "+ref.String()+" ORDER BY dim", func(_ context.Context, sql string) error {
		authorized = append(authorized, sql)
		return nil
	})
	require.NoError(t, err)
	require.Equal(t, []string{source}, authorized)
	require.Equal(t, []map[string]any{{"dim": "a", "n": float64(1)}, {"dim": "b", "n": float64(2)}}, arrowRows(t, data))

	_, err = db.db.ExecContext(t.Context(), "DROP TABLE "+ref.String())
	require.NoError(t, err)
	_, err = p.QueryArrow(t.Context(), scope, "SELECT * FROM "+ref.String(), nil)
	var missing *MissingPreAggregateError
	require.ErrorAs(t, err, &missing)
	require.Equal(t, &MissingPreAggregateError{first.Catalog, first.Schema, first.Table}, missing)
	rebuilt, err := p.Materialize(t.Context(), scope, source)
	require.NoError(t, err)
	require.Equal(t, first.Table, rebuilt.Table)
	require.True(t, rebuilt.CreatedAt.After(first.CreatedAt))
}

func TestPreAggregateScope(t *testing.T) {
	_, p, scope := setupPreAggregator(t, PreAggregateLimits{})
	source := `SELECT * FROM memory.tenant.source`
	first, err := p.Materialize(t.Context(), scope, source)
	require.NoError(t, err)
	ref := p.reference(scope.Key, source)
	other := scope
	other.Key = "another-reader"
	second, err := p.Materialize(t.Context(), other, source)
	require.NoError(t, err)
	require.NotEqual(t, first.Schema, second.Schema)
	_, err = p.QueryArrow(t.Context(), other, "SELECT * FROM "+ref.String(), nil)
	require.ErrorIs(t, err, ErrAccessDenied)

	scope.Sources = nil
	_, err = p.Materialize(t.Context(), scope, source)
	require.ErrorIs(t, err, ErrAccessDenied)
	_, err = p.QueryArrow(t.Context(), scope, "SELECT * FROM "+ref.String(), nil)
	require.ErrorIs(t, err, ErrAccessDenied)
}

func TestPreAggregateSourceAuthorization(t *testing.T) {
	_, p, scope := setupPreAggregator(t, PreAggregateLimits{})
	source := `SELECT * FROM memory.tenant.source`
	_, err := p.Materialize(t.Context(), scope, source)
	require.NoError(t, err)
	p.limits.TTL = time.Nanosecond
	denied := errors.New("source authorization revoked")
	_, err = p.QueryArrow(t.Context(), scope, "SELECT * FROM "+p.reference(scope.Key, source).String(), func(context.Context, string) error {
		return denied
	})
	require.ErrorIs(t, err, denied)
}

func TestPreAggregateValidation(t *testing.T) {
	_, p, scope := setupPreAggregator(t, PreAggregateLimits{})
	for _, source := range []string{
		`SELECT * FROM memory.tenant.source; SELECT 2`,
		`SELECT 1; CREATE TABLE injected AS SELECT 2`,
		`CREATE TABLE injected AS SELECT 2`,
		`SHOW TABLES`,
		`DESCRIBE SELECT * FROM memory.tenant.source`,
		`SELECT $1`,
		`SELECT * FROM 'private.parquet'`,
		`SELECT * FROM read_parquet('private.parquet')`,
		`SELECT * FROM query('SELECT * FROM private.source')`,
		`SELECT * FROM query_table('private.source')`,
		`SELECT * FROM duckdb_tables()`,
		`SELECT * FROM private.source`,
		`SELECT * FROM other.tenant.source`,
		`SELECT tenant.count(*) FROM memory.tenant.source`,
		`WITH x AS (SELECT * FROM memory.tenant.source) SELECT * FROM (WITH x AS (SELECT 1) SELECT * FROM x), private.x`,
		`SELECT * FROM (WITH x AS (SELECT 1) SELECT * FROM x), x`,
		`WITH x AS (SELECT * FROM later), later AS (SELECT 1) SELECT * FROM x`,
		`WITH Foo AS (SELECT 1), x AS (WITH foo AS (SELECT * FROM FOO) SELECT * FROM foo) SELECT * FROM x`,
		`WITH RECURSIVE x(i) AS (SELECT 1 UNION ALL SELECT i+1 FROM x WHERE i<3) SELECT * FROM x`,
	} {
		t.Run(source, func(t *testing.T) {
			_, err := p.Materialize(t.Context(), scope, source)
			require.Error(t, err)
		})
	}
	ref := p.reference(scope.Key, `SELECT 1`)
	_, err := p.Materialize(t.Context(), scope, "SELECT * FROM "+ref.String())
	require.ErrorIs(t, err, ErrAccessDenied)
}

func TestPreAggregateSelectForms(t *testing.T) {
	db, p, scope := setupPreAggregator(t, PreAggregateLimits{})
	_, err := db.db.ExecContext(t.Context(), `CREATE SCHEMA "tenant.with.dots";
CREATE TABLE "tenant.with.dots"."source""name" AS SELECT 42 AS x`)
	require.NoError(t, err)
	scope.Sources = append(scope.Sources, PreAggregateNamespace{"memory", "tenant.with.dots"})
	for _, source := range []string{
		`WITH x AS (SELECT * FROM memory.tenant.source) SELECT dim, count(*) FROM x GROUP BY dim`,
		`SELECT * FROM memory.tenant.source UNION ALL SELECT * FROM memory.tenant.source`,
		`SELECT * FROM "memory"."tenant.with.dots"."source""name"`,
		`SELECT '; SELECT 2' AS x; -- a single statement`,
		`SELECT * FROM range(3)`,
		`WITH a AS (SELECT * FROM memory.tenant.source), b AS (SELECT * FROM A) SELECT * FROM b`,
	} {
		t.Run(source, func(t *testing.T) {
			_, err := p.Materialize(t.Context(), scope, source)
			require.NoError(t, err)
		})
	}
	_, err = p.QueryArrow(t.Context(), scope, `DESCRIBE SELECT * FROM memory.tenant.source`, nil)
	require.NoError(t, err)
}

func TestPreAggregateMetadata(t *testing.T) {
	db, p, scope := setupPreAggregator(t, PreAggregateLimits{})
	source := `SELECT * FROM memory.tenant.source`
	first, err := p.Materialize(t.Context(), scope, source)
	require.NoError(t, err)
	restarted, err := NewPreAggregator(t.Context(), db, "", PreAggregateLimits{})
	require.NoError(t, err)
	again, err := restarted.Materialize(t.Context(), scope, source)
	require.NoError(t, err)
	require.Equal(t, first, again)
	ref := p.reference(scope.Key, source)
	_, err = db.db.ExecContext(t.Context(), "COMMENT ON TABLE "+ref.String()+" IS NULL")
	require.NoError(t, err)
	_, err = p.Materialize(t.Context(), scope, source)
	require.ErrorIs(t, err, ErrAccessDenied)
	_, err = p.QueryArrow(t.Context(), scope, "SELECT * FROM "+ref.String(), nil)
	require.ErrorIs(t, err, ErrAccessDenied)
}

func TestPreAggregateConcurrency(t *testing.T) {
	for _, distinct := range []bool{false, true} {
		t.Run(fmt.Sprint(distinct), func(t *testing.T) {
			_, p, scope := setupPreAggregator(t, PreAggregateLimits{})
			const count = 8
			results := make([]PreaggResponse, count)
			errs := make([]error, count)
			var group sync.WaitGroup
			for i := range count {
				group.Go(func() {
					source := `SELECT sum(i) AS n FROM range(1000000) t(i)`
					if distinct {
						source += fmt.Sprintf(" WHERE i > %d", i)
					}
					results[i], errs[i] = p.Materialize(t.Context(), scope, source)
				})
			}
			group.Wait()
			for i := range count {
				require.NoError(t, errs[i])
				if !distinct {
					require.Equal(t, results[0], results[i])
				} else if i > 0 {
					require.NotEqual(t, results[0].Table, results[i].Table)
				}
			}
		})
	}
}

func TestPreAggregateQueue(t *testing.T) {
	_, p, scope := setupPreAggregator(t, PreAggregateLimits{MaxPendingBuilds: 2})
	p.lane <- struct{}{}
	release := sync.OnceFunc(func() { <-p.lane })
	defer release()
	waitPending := func(count int) {
		require.Eventually(t, func() bool {
			p.mu.Lock()
			defer p.mu.Unlock()
			return len(p.builds) == count
		}, time.Second, time.Millisecond)
	}
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	owner := make(chan error, 1)
	go func() {
		_, err := p.Materialize(ctx, scope, `SELECT 1 AS x`)
		owner <- err
	}()
	waitPending(1)
	cancel()
	require.ErrorIs(t, <-owner, context.Canceled)

	results := make(chan error, 2)
	for _, source := range []string{`SELECT 1 AS x`, `SELECT 2 AS x`} {
		go func() {
			_, err := p.Materialize(t.Context(), scope, source)
			results <- err
		}()
	}
	waitPending(2)
	_, err := p.Materialize(t.Context(), scope, `SELECT 3 AS x`)
	require.ErrorIs(t, err, ErrPreAggregateLimit)
	data, err := p.QueryArrow(t.Context(), scope, `SELECT 42 AS x`, nil)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"x": float64(42)}}, arrowRows(t, data))
	release()
	for range 2 {
		require.NoError(t, <-results)
	}
}

func TestPreAggregateQueueDeadline(t *testing.T) {
	_, p, scope := setupPreAggregator(t, PreAggregateLimits{Timeout: 20 * time.Millisecond})
	p.lane <- struct{}{}
	defer func() { <-p.lane }()
	_, err := p.Materialize(t.Context(), scope, `SELECT 1`)
	require.ErrorIs(t, err, context.DeadlineExceeded)
	require.Eventually(t, func() bool {
		p.mu.Lock()
		defer p.mu.Unlock()
		return len(p.builds) == 0
	}, time.Second, time.Millisecond)
}

func TestPreAggregateLimits(t *testing.T) {
	for _, limits := range []PreAggregateLimits{{MaxRows: 2}, {MaxBytes: 1}} {
		t.Run(fmt.Sprint(limits), func(t *testing.T) {
			db, p, scope := setupPreAggregator(t, limits)
			_, err := p.Materialize(t.Context(), scope, `SELECT * FROM memory.tenant.source`)
			require.ErrorIs(t, err, ErrPreAggregateLimit)
			var count int
			err = db.db.QueryRowContext(t.Context(), `SELECT count(*) FROM duckdb_tables() WHERE starts_with(schema_name, 'mosaic_preagg_')`).Scan(&count)
			require.NoError(t, err)
			require.Zero(t, count)
		})
	}
}

func TestPreAggregateEviction(t *testing.T) {
	_, p, scope := setupPreAggregator(t, PreAggregateLimits{MaxTables: 2, MaxTablesPerScope: 1})
	first := `SELECT 1 AS x`
	_, err := p.Materialize(t.Context(), scope, first)
	require.NoError(t, err)
	_, err = p.Materialize(t.Context(), scope, `SELECT 2 AS x`)
	require.NoError(t, err)
	_, err = p.QueryArrow(t.Context(), scope, "SELECT * FROM "+p.reference(scope.Key, first).String(), nil)
	var missing *MissingPreAggregateError
	require.ErrorAs(t, err, &missing)

	for _, key := range []string{"second-scope", "third-scope"} {
		next := scope
		next.Key = key
		_, err = p.Materialize(t.Context(), next, first)
		require.NoError(t, err)
	}
	_, err = p.QueryArrow(t.Context(), scope, "SELECT * FROM "+p.reference(scope.Key, `SELECT 2 AS x`).String(), nil)
	require.ErrorAs(t, err, &missing)
}

func TestPreAggregateFailedBuildPreservesVictims(t *testing.T) {
	_, p, scope := setupPreAggregator(t, PreAggregateLimits{MaxTables: 1, MaxRows: 2})
	source := `SELECT 1 AS x`
	_, err := p.Materialize(t.Context(), scope, source)
	require.NoError(t, err)
	_, err = p.Materialize(t.Context(), scope, `SELECT * FROM memory.tenant.source`)
	require.ErrorIs(t, err, ErrPreAggregateLimit)
	data, err := p.QueryArrow(t.Context(), scope, "SELECT * FROM "+p.reference(scope.Key, source).String(), nil)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"x": float64(1)}}, arrowRows(t, data))
}

func TestPreAggregateDeadline(t *testing.T) {
	_, p, scope := setupPreAggregator(t, PreAggregateLimits{Timeout: 10 * time.Millisecond})
	_, err := p.Materialize(t.Context(), scope, `SELECT sum(i) AS n FROM range(1000000000) t(i)`)
	require.Error(t, err)
	p.limits.Timeout = time.Second
	_, err = p.Materialize(t.Context(), scope, `SELECT 1`)
	require.NoError(t, err)
}

func TestPreAggregateReadOnlyCatalog(t *testing.T) {
	db, p, scope := setupPreAggregator(t, PreAggregateLimits{})
	path := quoteLiteral(t.TempDir() + "/source.duckdb")
	_, err := db.db.ExecContext(t.Context(), "ATTACH "+path+` AS raw;
CREATE SCHEMA raw.tenant;
CREATE TABLE raw.tenant.source AS SELECT 42 AS x;
DETACH raw;
ATTACH `+path+" AS raw (READ_ONLY)")
	require.NoError(t, err)
	scope.Sources = []PreAggregateNamespace{{"raw", "tenant"}}
	source := `SELECT * FROM raw.tenant.source`
	table, err := p.Materialize(t.Context(), scope, source)
	require.NoError(t, err)
	require.Equal(t, "memory", table.Catalog)
	data, err := p.QueryArrow(t.Context(), scope, "SELECT * FROM "+p.reference(scope.Key, source).String(), nil)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"x": float64(42)}}, arrowRows(t, data))
}

func TestPreAggregateAmbiguousNames(t *testing.T) {
	db, p, scope := setupPreAggregator(t, PreAggregateLimits{})
	_, err := db.db.ExecContext(t.Context(), `ATTACH ':memory:' AS tenant;
CREATE TABLE tenant.main.secret AS SELECT 42 AS x`)
	require.NoError(t, err)
	for _, source := range []string{`SELECT * FROM tenant.secret`, `SELECT * FROM source`} {
		_, err = p.Materialize(t.Context(), scope, source)
		require.ErrorIs(t, err, ErrAccessDenied)
		_, err = p.QueryArrow(t.Context(), scope, source, nil)
		require.ErrorIs(t, err, ErrAccessDenied)
	}
}

func TestPreAggregateExpiry(t *testing.T) {
	_, p, scope := setupPreAggregator(t, PreAggregateLimits{})
	source := `SELECT 1 AS x`
	first, err := p.Materialize(t.Context(), scope, source)
	require.NoError(t, err)
	p.limits.TTL = time.Nanosecond
	_, err = p.QueryArrow(t.Context(), scope, "SELECT * FROM "+p.reference(scope.Key, source).String(), nil)
	var missing *MissingPreAggregateError
	require.ErrorAs(t, err, &missing)
	again, err := p.Materialize(t.Context(), scope, source)
	require.NoError(t, err)
	require.True(t, again.CreatedAt.After(first.CreatedAt))
}

func TestPreAggregateConfiguration(t *testing.T) {
	db := setupTestDB(t, WithMaxConnections(1))
	_, err := NewPreAggregator(t.Context(), db, "", PreAggregateLimits{})
	require.ErrorContains(t, err, "at least two SQL connections")
	db = setupTestDB(t)
	_, err = NewPreAggregator(t.Context(), db, "temp", PreAggregateLimits{})
	require.ErrorContains(t, err, "invalid preaggregation catalog")
	_, err = NewPreAggregator(t.Context(), db, "", PreAggregateLimits{MaxRows: -1})
	require.ErrorContains(t, err, "must be positive")
}

func TestPreAggregateEvictsWithinScopeFirst(t *testing.T) {
	_, p, scope := setupPreAggregator(t, PreAggregateLimits{MaxTables: 2, MaxTablesPerScope: 1})
	other := scope
	other.Key = "other"
	_, err := p.Materialize(t.Context(), other, `SELECT 1`)
	require.NoError(t, err)
	_, err = p.Materialize(t.Context(), scope, `SELECT 1`)
	require.NoError(t, err)
	_, err = p.Materialize(t.Context(), scope, `SELECT 2`)
	require.NoError(t, err)
	_, err = p.QueryArrow(t.Context(), other, "SELECT * FROM "+p.reference(other.Key, `SELECT 1`).String(), nil)
	require.NoError(t, err)
}

func TestPreAggregateRejectsQualifiedReplacementScan(t *testing.T) {
	db, p, scope := setupPreAggregator(t, PreAggregateLimits{})
	path := t.TempDir() + "/private.parquet"
	_, err := db.db.ExecContext(t.Context(), "COPY (SELECT 99 AS secret) TO "+quoteLiteral(path)+" (FORMAT PARQUET)")
	require.NoError(t, err)
	var value int
	err = db.db.QueryRowContext(t.Context(), "SELECT secret FROM "+quoteIdentifier(path)).Scan(&value)
	require.NoError(t, err)
	require.Equal(t, 99, value)
	_, err = p.Materialize(t.Context(), scope, `SELECT * FROM "memory"."tenant".`+quoteIdentifier(path))
	require.Error(t, err)
}
