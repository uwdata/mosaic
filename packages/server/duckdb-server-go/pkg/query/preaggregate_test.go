package query

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"path/filepath"
	"sync"
	"testing"

	"github.com/stretchr/testify/require"
)

var reader = Namespace{Schema: []string{"reader"}}

func tenantPolicy(namespaces ...string) *ValidationPolicy {
	catalog := "memory"
	rules := []TableRule{{Catalog: &catalog, Schema: "tenant", Table: "*"}}
	for _, schema := range namespaces {
		rules = append(rules, TableRule{Catalog: &catalog, Schema: schema, Table: "*"})
	}
	return &ValidationPolicy{AllowedTables: rules}
}

func setupPreAggregator(t *testing.T) (*DB, *PreAggregator) {
	t.Helper()
	return setupMaterializer(t, nil)
}

func setupMaterializer(t *testing.T, materializer Materializer) (*DB, *PreAggregator) {
	t.Helper()
	db := setupTestDB(t, true, WithValidation())
	_, err := db.db.ExecContext(t.Context(), `CREATE SCHEMA tenant;
CREATE TABLE tenant.source AS SELECT * FROM (VALUES ('a'), ('b'), ('b')) t(dim);
CREATE SCHEMA private;
CREATE TABLE private.source AS SELECT 42 AS secret`)
	require.NoError(t, err)
	p, err := NewPreAggregator(t.Context(), db, materializer)
	require.NoError(t, err)
	return db, p
}

func TestPreAggregateMaterialize(t *testing.T) {
	db, p := setupPreAggregator(t)
	policy := tenantPolicy()
	source := `SELECT dim, count(*) AS n FROM memory.tenant.source GROUP BY dim`
	first, err := p.Materialize(t.Context(), reader, source, policy)
	require.NoError(t, err)
	ref := p.reference(Namespace{"memory", []string{"reader"}}, source)
	require.Equal(t, ref, first.Reference)
	require.Equal(t, `"memory"."reader".`+quoteIdentifier(ref.Table), ref.String())
	require.False(t, first.CreatedAt.IsZero())
	// dim VARCHAR (16) + n BIGINT (8) over two rows.
	require.Equal(t, Stats{Rows: 2, Bytes: 48}, first.Stats)
	again, err := p.Materialize(t.Context(), reader, source, policy)
	require.NoError(t, err)
	require.Equal(t, first, again)

	var authorized []string
	data, err := p.Query(t.Context(), reader, "SELECT * FROM "+ref.String()+" ORDER BY dim", policy, func(_ context.Context, sql string) (*ValidationPolicy, error) {
		authorized = append(authorized, sql)
		return policy, nil
	})
	require.NoError(t, err)
	require.Equal(t, []string{source}, authorized)
	require.Equal(t, []map[string]any{{"dim": "a", "n": float64(1)}, {"dim": "b", "n": float64(2)}}, arrowRows(t, data))

	_, err = db.db.ExecContext(t.Context(), "DROP TABLE "+ref.String())
	require.NoError(t, err)
	_, err = p.Query(t.Context(), reader, "SELECT * FROM "+ref.String(), policy, nil)
	var missingErr *MissingPreAggregateError
	require.ErrorAs(t, err, &missingErr)
	require.Equal(t, &MissingPreAggregateError{first.Reference}, missingErr)
	rebuilt, err := p.Materialize(t.Context(), reader, source, policy)
	require.NoError(t, err)
	require.Equal(t, first.Reference, rebuilt.Reference)
	require.True(t, rebuilt.CreatedAt.After(first.CreatedAt))
}

func TestPreAggregateNamespace(t *testing.T) {
	_, p := setupPreAggregator(t)
	policy := tenantPolicy()
	source := `SELECT * FROM memory.tenant.source`
	first, err := p.Materialize(t.Context(), reader, source, policy)
	require.NoError(t, err)
	ref := p.reference(Namespace{"memory", []string{"reader"}}, source)
	second, err := p.Materialize(t.Context(), Namespace{Schema: []string{"another"}}, source, policy)
	require.NoError(t, err)
	require.NotEqual(t, first.Reference.Schema, second.Reference.Schema)
	_, err = p.Query(t.Context(), Namespace{Schema: []string{"another"}}, "SELECT * FROM "+ref.String(), policy, nil)
	require.ErrorIs(t, err, ErrAccessDenied)
	_, err = p.Query(t.Context(), Namespace{Schema: []string{"another"}}, "SELECT * FROM "+ref.String(), nil, nil)
	require.NoError(t, err)

	denied := &ValidationPolicy{AllowedTables: []TableRule{}}
	_, err = p.Materialize(t.Context(), reader, source, denied)
	require.ErrorIs(t, err, ErrAccessDenied)
	_, err = p.Query(t.Context(), reader, "SELECT * FROM "+ref.String(), denied, nil)
	require.ErrorIs(t, err, ErrAccessDenied)
	_, err = p.Materialize(t.Context(), Namespace{}, source, policy)
	require.ErrorContains(t, err, "exactly one schema component")
	_, err = p.Materialize(t.Context(), Namespace{Schema: []string{"a", "b"}}, source, policy)
	require.ErrorContains(t, err, "exactly one schema component")
	_, err = p.Materialize(t.Context(), Namespace{Schema: []string{""}}, source, policy)
	require.ErrorContains(t, err, "invalid preaggregation namespace")
}

func TestPreAggregateSourceAuthorization(t *testing.T) {
	_, p := setupPreAggregator(t)
	policy := tenantPolicy()
	source := `SELECT * FROM memory.tenant.source`
	_, err := p.Materialize(t.Context(), reader, source, policy)
	require.NoError(t, err)
	ref := "SELECT * FROM " + p.reference(Namespace{"memory", []string{"reader"}}, source).String()
	denied := errors.New("source authorization revoked")
	_, err = p.Query(t.Context(), reader, ref, policy, func(context.Context, string) (*ValidationPolicy, error) {
		return nil, denied
	})
	require.ErrorIs(t, err, denied)
	_, err = p.Query(t.Context(), reader, ref, policy, func(context.Context, string) (*ValidationPolicy, error) {
		return &ValidationPolicy{AllowedTables: []TableRule{}}, nil
	})
	require.ErrorIs(t, err, ErrAccessDenied)
}

func TestPreAggregateValidation(t *testing.T) {
	_, p := setupPreAggregator(t)
	policy := tenantPolicy()
	for _, source := range []string{
		`SELECT * FROM memory.tenant.source; SELECT 2`,
		`SELECT 1; CREATE TABLE injected AS SELECT 2`,
		`CREATE TABLE injected AS SELECT 2`,
		`SHOW TABLES`,
		`SELECT $1`,
		`SELECT * FROM 'private.parquet'`,
		`SELECT * FROM read_parquet('private.parquet')`,
		`SELECT * FROM query('SELECT * FROM private.source')`,
		`SELECT * FROM query_table('private.source')`,
		`SELECT * FROM duckdb_tables()`,
		`SELECT * FROM private.source`,
		`SELECT * FROM memory.private.source`,
		`SELECT * FROM other.tenant.source`,
		`SELECT tenant.count(*) FROM memory.tenant.source`,
		`WITH x AS (SELECT * FROM memory.tenant.source) SELECT * FROM (WITH x AS (SELECT 1) SELECT * FROM x), private.x`,
		`SELECT * FROM (WITH x AS (SELECT 1) SELECT * FROM x), x`,
		`WITH x AS (SELECT * FROM later), later AS (SELECT 1) SELECT * FROM x`,
	} {
		t.Run(source, func(t *testing.T) {
			_, err := p.Materialize(t.Context(), reader, source, policy)
			require.ErrorIs(t, err, ErrValidation)
		})
	}
	_, err := p.Materialize(t.Context(), reader, `SELECT * FROM private.source`, policy)
	require.ErrorIs(t, err, ErrAccessDenied)

	table, err := p.Materialize(t.Context(), reader, `SELECT 1 AS x`, policy)
	require.NoError(t, err)
	derived := "SELECT * FROM " + p.reference(Namespace{"memory", []string{"reader"}}, `SELECT 1 AS x`).String()
	_, err = p.Materialize(t.Context(), reader, derived, policy)
	require.ErrorIs(t, err, ErrAccessDenied)
	_, err = p.Materialize(t.Context(), reader, derived, nil)
	require.ErrorIs(t, err, ErrAccessDenied)
	data, err := p.Query(t.Context(), reader, derived, nil, nil)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"x": float64(1)}}, arrowRows(t, data))
	require.Equal(t, "memory", table.Reference.Catalog)
}

func TestPreAggregateSelectForms(t *testing.T) {
	db, p := setupPreAggregator(t)
	_, err := db.db.ExecContext(t.Context(), `CREATE SCHEMA "tenant.with.dots";
CREATE TABLE "tenant.with.dots"."source""name" AS SELECT 42 AS x`)
	require.NoError(t, err)
	policy := tenantPolicy("tenant.with.dots")
	for _, source := range []string{
		`WITH x AS (SELECT * FROM memory.tenant.source) SELECT dim, count(*) FROM x GROUP BY dim`,
		`SELECT * FROM memory.tenant.source UNION ALL SELECT * FROM memory.tenant.source`,
		`SELECT * FROM "memory"."tenant.with.dots"."source""name"`,
		`SELECT '; SELECT 2' AS x; -- a single statement`,
		`SELECT * FROM range(3)`,
		`WITH a AS (SELECT * FROM memory.tenant.source), b AS (SELECT * FROM A) SELECT * FROM b`,
		`WITH RECURSIVE x(i) AS (SELECT 1 UNION ALL SELECT i+1 FROM x WHERE i<3) SELECT * FROM x`,
	} {
		t.Run(source, func(t *testing.T) {
			_, err := p.Materialize(t.Context(), reader, source, policy)
			require.NoError(t, err)
		})
	}
	_, err = p.Query(t.Context(), reader, `DESCRIBE SELECT * FROM memory.tenant.source`, policy, nil)
	require.NoError(t, err)
}

func TestPreAggregateJSONPolicy(t *testing.T) {
	_, p := setupPreAggregator(t)
	document := `{"version":1,"options":{}}`
	policy := &ValidationPolicy{JSON: &document}
	_, err := p.Materialize(t.Context(), reader, `SELECT 1 AS x`, policy)
	require.ErrorIs(t, err, ErrInvalidPolicy)
	_, err = p.Query(t.Context(), reader, `SELECT 1 AS x`, policy, nil)
	require.ErrorIs(t, err, ErrInvalidPolicy)
}

func TestPreAggregateMetadata(t *testing.T) {
	db, p := setupPreAggregator(t)
	policy := tenantPolicy()
	source := `SELECT * FROM memory.tenant.source`
	first, err := p.Materialize(t.Context(), reader, source, policy)
	require.NoError(t, err)
	restarted, err := NewPreAggregator(t.Context(), db, nil)
	require.NoError(t, err)
	again, err := restarted.Materialize(t.Context(), reader, source, policy)
	require.NoError(t, err)
	require.Equal(t, first, again)
	ref := p.reference(Namespace{"memory", []string{"reader"}}, source)
	_, err = db.db.ExecContext(t.Context(), "COMMENT ON TABLE "+ref.String()+" IS NULL")
	require.NoError(t, err)
	_, err = p.Materialize(t.Context(), reader, source, policy)
	require.ErrorIs(t, err, ErrAccessDenied)
	_, err = p.Query(t.Context(), reader, "SELECT * FROM "+ref.String(), policy, nil)
	require.ErrorIs(t, err, ErrAccessDenied)
}

func TestPreAggregateConcurrency(t *testing.T) {
	for _, distinct := range []bool{false, true} {
		t.Run(fmt.Sprint(distinct), func(t *testing.T) {
			_, p := setupPreAggregator(t)
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
					results[i], errs[i] = p.Materialize(t.Context(), reader, source, nil)
				})
			}
			group.Wait()
			for i := range count {
				require.NoError(t, errs[i])
				if !distinct {
					require.Equal(t, results[0], results[i])
				} else if i > 0 {
					require.NotEqual(t, results[0].Reference.Table, results[i].Reference.Table)
				}
			}
		})
	}
}

func TestPreAggregateReadOnlyCatalog(t *testing.T) {
	db, p := setupPreAggregator(t)
	path := quoteLiteral(t.TempDir() + "/source.duckdb")
	_, err := db.db.ExecContext(t.Context(), "ATTACH "+path+` AS raw;
CREATE SCHEMA raw.tenant;
CREATE TABLE raw.tenant.source AS SELECT 42 AS x;
DETACH raw;
ATTACH `+path+" AS raw (READ_ONLY)")
	require.NoError(t, err)
	catalog := "raw"
	policy := &ValidationPolicy{AllowedTables: []TableRule{{Catalog: &catalog, Schema: "tenant", Table: "*"}}}
	source := `SELECT * FROM raw.tenant.source`
	table, err := p.Materialize(t.Context(), reader, source, policy)
	require.NoError(t, err)
	require.Equal(t, "memory", table.Reference.Catalog)
	data, err := p.Query(t.Context(), reader, "SELECT * FROM "+p.reference(Namespace{"memory", []string{"reader"}}, source).String(), policy, nil)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"x": float64(42)}}, arrowRows(t, data))
}

func TestPreAggregateAmbiguousNames(t *testing.T) {
	db, p := setupPreAggregator(t)
	_, err := db.db.ExecContext(t.Context(), `ATTACH ':memory:' AS tenant;
CREATE TABLE tenant.main.secret AS SELECT 42 AS x`)
	require.NoError(t, err)
	policy := tenantPolicy()
	_, err = p.Materialize(t.Context(), reader, `SELECT * FROM tenant.secret`, policy)
	require.ErrorIs(t, err, ErrValidation)
	_, err = p.Query(t.Context(), reader, `SELECT * FROM tenant.secret`, policy, nil)
	require.ErrorIs(t, err, ErrValidation)
	_, err = p.Materialize(t.Context(), reader, `SELECT * FROM source`, policy)
	require.ErrorIs(t, err, ErrValidation)
}

func TestPreAggregateConfiguration(t *testing.T) {
	_, err := NewPreAggregator(t.Context(), setupTestDB(t, true), nil)
	require.ErrorContains(t, err, "requires WithValidation")
	db := setupTestDB(t, true, WithValidation(), WithMaxConnections(1))
	p, err := NewPreAggregator(t.Context(), db, nil)
	require.NoError(t, err)
	table, err := p.Materialize(t.Context(), reader, `SELECT 1 AS x`, nil)
	require.NoError(t, err)
	require.Equal(t, "memory", table.Reference.Catalog)
	data, err := p.Query(t.Context(), reader, "SELECT * FROM "+p.reference(Namespace{"memory", []string{"reader"}}, `SELECT 1 AS x`).String(), nil, nil)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"x": float64(1)}}, arrowRows(t, data))
}

func TestPreAggregateRejectsQualifiedReplacementScan(t *testing.T) {
	db, p := setupPreAggregator(t)
	path := t.TempDir() + "/private.parquet"
	_, err := db.db.ExecContext(t.Context(), "COPY (SELECT 99 AS secret) TO "+quoteLiteral(path)+" (FORMAT PARQUET)")
	require.NoError(t, err)
	var value int
	err = db.db.QueryRowContext(t.Context(), "SELECT secret FROM "+quoteIdentifier(path)).Scan(&value)
	require.NoError(t, err)
	require.Equal(t, 99, value)
	_, err = p.Materialize(t.Context(), reader, `SELECT * FROM "memory"."tenant".`+quoteIdentifier(path), tenantPolicy())
	require.ErrorIs(t, err, ErrValidation)
}

func setupParquet(t *testing.T) (*DB, *PreAggregator, string) {
	t.Helper()
	dir := t.TempDir()
	db, p := setupMaterializer(t, &ParquetMaterializer{Directory: dir})
	return db, p, dir
}

func parquetFiles(t *testing.T, dir string) []string {
	t.Helper()
	var files []string
	require.NoError(t, filepath.WalkDir(dir, func(path string, entry fs.DirEntry, err error) error {
		if err == nil && !entry.IsDir() {
			files = append(files, path)
		}
		return err
	}))
	return files
}

func TestParquetMaterialize(t *testing.T) {
	db, p, dir := setupParquet(t)
	policy := tenantPolicy()
	source := `SELECT dim, count(*) AS n FROM memory.tenant.source GROUP BY dim`
	first, err := p.Materialize(t.Context(), reader, source, policy)
	require.NoError(t, err)
	ref := p.reference(Namespace{"memory", []string{"reader"}}, source)
	require.Equal(t, []string{filepath.Join(dir, "memory", "reader", ref.Table+".parquet")}, parquetFiles(t, dir))
	var kind string
	require.NoError(t, db.db.QueryRowContext(t.Context(), "SELECT kind FROM ("+managedObjects+") WHERE schema_name = ? AND name = ?", "reader", ref.Table).Scan(&kind))
	require.Equal(t, "view", kind)
	require.Equal(t, int64(2), first.Rows)
	require.Positive(t, first.Bytes)

	data, err := p.Query(t.Context(), reader, "SELECT * FROM "+ref.String()+" ORDER BY dim", policy, nil)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"dim": "a", "n": float64(1)}, {"dim": "b", "n": float64(2)}}, arrowRows(t, data))
	again, err := p.Materialize(t.Context(), reader, source, policy)
	require.NoError(t, err)
	require.Equal(t, first, again)

	// A replica without the view republishes from the file instead of recomputing.
	_, err = db.db.ExecContext(t.Context(), "DROP VIEW "+ref.String()+"; DELETE FROM memory.tenant.source")
	require.NoError(t, err)
	_, err = p.Query(t.Context(), reader, "SELECT * FROM "+ref.String(), policy, nil)
	var missingErr *MissingPreAggregateError
	require.ErrorAs(t, err, &missingErr)
	rebuilt, err := p.Materialize(t.Context(), reader, source, policy)
	require.NoError(t, err)
	require.Equal(t, first.Reference, rebuilt.Reference)
	require.Equal(t, first.Stats, rebuilt.Stats)
	data, err = p.Query(t.Context(), reader, "SELECT count(*) AS n FROM "+ref.String(), policy, nil)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"n": float64(2)}}, arrowRows(t, data))
}

func TestParquetDirectory(t *testing.T) {
	_, p := setupMaterializer(t, &ParquetMaterializer{})
	_, err := p.Materialize(t.Context(), reader, `SELECT 1 AS x`, nil)
	require.ErrorContains(t, err, "requires a directory")
	_, p = setupMaterializer(t, &ParquetMaterializer{Directory: "it's"})
	_, err = p.Materialize(t.Context(), reader, `SELECT 1 AS x`, nil)
	require.ErrorContains(t, err, "invalid parquet directory")
}

func TestParquetConcurrentIdenticalBuilds(t *testing.T) {
	_, p, dir := setupParquet(t)
	const count = 8
	results := make([]PreaggResponse, count)
	errs := make([]error, count)
	var group sync.WaitGroup
	for i := range count {
		group.Go(func() {
			results[i], errs[i] = p.Materialize(t.Context(), reader, `SELECT i FROM range(1000000) t(i)`, nil)
		})
	}
	group.Wait()
	for i := range count {
		require.NoError(t, errs[i])
		require.Equal(t, results[0].Reference, results[i].Reference)
	}
	require.Len(t, parquetFiles(t, dir), 1)
}

func TestParquetNamespacesDoNotAliasFiles(t *testing.T) {
	db, p, dir := setupParquet(t)
	policy := tenantPolicy()
	source := `SELECT * FROM memory.tenant.source`
	first, err := p.Materialize(t.Context(), reader, source, policy)
	require.NoError(t, err)
	require.Equal(t, int64(3), first.Rows)
	_, err = db.db.ExecContext(t.Context(), "DELETE FROM memory.tenant.source")
	require.NoError(t, err)
	for _, schema := range []string{"./reader", "reader/../reader", "reader*", `re"ader`, "reader%2F"} {
		second, err := p.Materialize(t.Context(), Namespace{Schema: []string{schema}}, source, policy)
		require.NoError(t, err, schema)
		require.Equal(t, int64(0), second.Rows, schema)
		require.NotEqual(t, first.Reference, second.Reference)
	}
	require.Len(t, parquetFiles(t, dir), 6)
	require.Equal(t, "%2E%2Freader", pathSegment("./reader"))
	require.Equal(t, "a_b-1", pathSegment("A_b-1"))

	// DuckDB identifiers are case-insensitive, so READER is the same object and the same file.
	same, err := p.Materialize(t.Context(), Namespace{Schema: []string{"READER"}}, source, policy)
	require.NoError(t, err)
	require.Equal(t, first.Rows, same.Rows)
	require.Len(t, parquetFiles(t, dir), 6)

	// That folding is ASCII-only: Ä and ä are distinct schemas.
	_, err = db.db.ExecContext(t.Context(), "INSERT INTO memory.tenant.source VALUES ('z')")
	require.NoError(t, err)
	upper, err := p.Materialize(t.Context(), Namespace{Schema: []string{"Ä"}}, source, policy)
	require.NoError(t, err)
	require.Equal(t, int64(1), upper.Rows)
	_, err = db.db.ExecContext(t.Context(), "DELETE FROM memory.tenant.source")
	require.NoError(t, err)
	lower, err := p.Materialize(t.Context(), Namespace{Schema: []string{"ä"}}, source, policy)
	require.NoError(t, err)
	require.Equal(t, int64(0), lower.Rows)
	require.NotEqual(t, upper.Reference, lower.Reference)
	require.Len(t, parquetFiles(t, dir), 8)
	require.True(t, identifierEqual("READER", "reader"))
	require.False(t, identifierEqual("Ä", "ä"))
}

func TestPreAggregateTemporarySourcesAreNotManaged(t *testing.T) {
	db := setupTestDB(t, true, WithValidation(), WithMaxConnections(1))
	conn, err := db.db.Conn(t.Context())
	require.NoError(t, err)
	_, err = conn.ExecContext(t.Context(), "CREATE TEMP TABLE source AS SELECT 42 AS x")
	require.NoError(t, err)
	require.NoError(t, conn.Close())
	p, err := NewPreAggregator(t.Context(), db, nil)
	require.NoError(t, err)
	data, err := p.Query(t.Context(), reader, "SELECT * FROM temp.main.source", nil, nil)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"x": float64(42)}}, arrowRows(t, data))
	table, err := p.Materialize(t.Context(), reader, "SELECT * FROM temp.main.source", nil)
	require.NoError(t, err)
	require.Equal(t, int64(1), table.Rows)
}

func TestPreAggregateSourceRevalidatedAcrossNamespaces(t *testing.T) {
	_, p := setupPreAggregator(t)
	source := `SELECT * FROM memory.tenant.source`
	first, err := p.Materialize(t.Context(), reader, source, tenantPolicy())
	require.NoError(t, err)
	other := Namespace{Schema: []string{"another"}}
	read := "SELECT * FROM " + first.Reference.String()
	data, err := p.Query(t.Context(), other, read, tenantPolicy("reader"), nil)
	require.NoError(t, err)
	require.Len(t, arrowRows(t, data), 3)
	revoked := errors.New("source revoked")
	_, err = p.Query(t.Context(), other, read, tenantPolicy("reader"), func(context.Context, string) (*ValidationPolicy, error) {
		return nil, revoked
	})
	require.ErrorIs(t, err, revoked)
	_, err = p.Query(t.Context(), other, read, tenantPolicy("reader"), func(context.Context, string) (*ValidationPolicy, error) {
		return &ValidationPolicy{AllowedTables: []TableRule{}}, nil
	})
	require.ErrorIs(t, err, ErrAccessDenied)
	_, err = p.Materialize(t.Context(), other, read, tenantPolicy("reader"))
	require.ErrorIs(t, err, ErrAccessDenied)
}
