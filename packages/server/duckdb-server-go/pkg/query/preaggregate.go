package query

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"strings"
	"sync"
	"time"
)

var ErrPreAggregateLimit = errors.New("query: preaggregation resource limit exceeded")

type PreAggregateNamespace struct {
	Catalog string
	Schema  string
}

type PreAggregateScope struct {
	Key     string
	Sources []PreAggregateNamespace
}

type PreAggregateLimits struct {
	MaxTables         int
	MaxTablesPerScope int
	MaxRows           int64
	MaxBytes          int64
	Timeout           time.Duration
	TTL               time.Duration
}

type PreaggResponse struct {
	Catalog   string    `json:"catalog"`
	Schema    string    `json:"schema"`
	Table     string    `json:"table"`
	CreatedAt time.Time `json:"createdAt"`
}

type MissingPreAggregateError struct {
	Catalog string
	Schema  string
	Table   string
}

func (e *MissingPreAggregateError) Error() string {
	return "Materialized table is unavailable"
}

type PreAggregator struct {
	db      *DB
	catalog string
	limits  PreAggregateLimits
	mu      sync.Mutex
	build   *preAggregateBuild
}

type preAggregateBuild struct {
	ref   preAggregateRef
	done  chan struct{}
	table PreaggResponse
	err   error
}

type preAggregateRef struct {
	catalog string
	schema  string
	table   string
}

func (r preAggregateRef) String() string {
	return quoteIdentifier(r.catalog) + "." + quoteIdentifier(r.schema) + "." + quoteIdentifier(r.table)
}

func (r preAggregateRef) missing() error {
	return &MissingPreAggregateError{Catalog: r.catalog, Schema: r.schema, Table: r.table}
}

type preAggregateMetadata struct {
	Version   int       `json:"version"`
	Scope     string    `json:"scope"`
	SQL       string    `json:"sql"`
	CreatedAt time.Time `json:"createdAt"`
	Rows      int64     `json:"rows"`
	Bytes     int64     `json:"bytes"`
}

type storedPreAggregate struct {
	ref preAggregateRef
	preAggregateMetadata
}

func NewPreAggregator(ctx context.Context, db *DB, catalog string, limits PreAggregateLimits) (*PreAggregator, error) {
	if db == nil {
		return nil, errors.New("query: database is required")
	}
	if db.db.Stats().MaxOpenConnections == 1 {
		return nil, errors.New("query: preaggregation requires at least two SQL connections")
	}
	defaults := PreAggregateLimits{128, 32, 1_000_000, 32 << 20, 90 * time.Second, 24 * time.Hour}
	if limits.MaxTables == 0 {
		limits.MaxTables = defaults.MaxTables
	}
	if limits.MaxTablesPerScope == 0 {
		limits.MaxTablesPerScope = defaults.MaxTablesPerScope
	}
	if limits.MaxRows == 0 {
		limits.MaxRows = defaults.MaxRows
	}
	if limits.MaxBytes == 0 {
		limits.MaxBytes = defaults.MaxBytes
	}
	if limits.Timeout == 0 {
		limits.Timeout = defaults.Timeout
	}
	if limits.TTL == 0 {
		limits.TTL = defaults.TTL
	}
	if limits.MaxTables < 1 || limits.MaxTablesPerScope < 1 || limits.MaxRows < 1 || limits.MaxBytes < 1 || limits.Timeout < 0 || limits.TTL < 0 {
		return nil, errors.New("query: preaggregation limits must be positive")
	}
	var defaultCatalog string
	if err := db.db.QueryRowContext(ctx, "SELECT current_database()").Scan(&defaultCatalog); err != nil {
		return nil, err
	}
	if catalog == "" {
		catalog = defaultCatalog
	}
	if strings.EqualFold(catalog, "temp") || strings.EqualFold(catalog, "system") || strings.ContainsRune(catalog, 0) {
		return nil, errors.New("query: invalid preaggregation catalog")
	}
	return &PreAggregator{db: db, catalog: catalog, limits: limits}, nil
}

func (p *PreAggregator) reference(scope, sql string) preAggregateRef {
	return preAggregateRef{
		catalog: p.catalog,
		schema:  fmt.Sprintf("mosaic_preagg_%x", sha256.Sum256([]byte(scope))),
		table:   fmt.Sprintf("preagg_%x", sha256.Sum256([]byte(sql))),
	}
}

func (p *PreAggregator) Materialize(ctx context.Context, scope PreAggregateScope, sql string) (PreaggResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, p.limits.Timeout)
	defer cancel()
	if _, err := p.validate(ctx, scope, sql, true); err != nil {
		return PreaggResponse{}, err
	}
	ref := p.reference(scope.Key, sql)
	stored, err := p.lookup(ctx, ref)
	if err != nil {
		return PreaggResponse{}, err
	}
	if stored != nil && p.usable(stored) {
		return p.response(ref, stored), nil
	}

	p.mu.Lock()
	if build := p.build; build != nil {
		p.mu.Unlock()
		if build.ref != ref {
			return PreaggResponse{}, ErrPreAggregateLimit
		}
		select {
		case <-ctx.Done():
			return PreaggResponse{}, ctx.Err()
		case <-build.done:
			return build.table, build.err
		}
	}
	build := &preAggregateBuild{ref: ref, done: make(chan struct{})}
	p.build = build
	p.mu.Unlock()

	build.table, build.err = p.materialize(ctx, ref, scope.Key, sql)
	if ctx.Err() != nil {
		build.err = ctx.Err()
	}
	p.mu.Lock()
	p.build = nil
	close(build.done)
	p.mu.Unlock()
	return build.table, build.err
}

func (p *PreAggregator) QueryArrow(ctx context.Context, scope PreAggregateScope, sql string, authorizeSource func(context.Context, string) error) ([]byte, error) {
	refs, err := p.validate(ctx, scope, sql, false)
	if err != nil {
		return nil, err
	}
	for _, ref := range refs {
		stored, err := p.lookup(ctx, ref)
		if err != nil {
			return nil, err
		}
		if stored == nil {
			return nil, ref.missing()
		}
		if _, err := p.validate(ctx, scope, stored.SQL, true); err != nil {
			return nil, err
		}
		if authorizeSource != nil {
			if err := authorizeSource(ctx, stored.SQL); err != nil {
				return nil, err
			}
		}
		if !p.usable(stored) {
			return nil, ref.missing()
		}
	}
	var buf bytes.Buffer
	if err := p.db.writeArrow(ctx, sql, &buf); err != nil {
		for _, ref := range refs {
			stored, lookupErr := p.lookup(ctx, ref)
			if lookupErr == nil && (stored == nil || !p.usable(stored)) {
				return nil, ref.missing()
			}
		}
		return nil, err
	}
	return buf.Bytes(), nil
}

func (p *PreAggregator) response(ref preAggregateRef, stored *preAggregateMetadata) PreaggResponse {
	return PreaggResponse{ref.catalog, ref.schema, ref.table, stored.CreatedAt}
}

func (p *PreAggregator) usable(stored *preAggregateMetadata) bool {
	return time.Since(stored.CreatedAt) < p.limits.TTL && stored.Rows <= p.limits.MaxRows && stored.Bytes <= p.limits.MaxBytes
}

func (p *PreAggregator) metadata(ref preAggregateRef, comment sql.NullString) (*preAggregateMetadata, error) {
	var stored preAggregateMetadata
	if !comment.Valid || json.Unmarshal([]byte(comment.String), &stored) != nil || stored.Version != 1 || stored.Scope == "" || stored.SQL == "" || stored.CreatedAt.IsZero() || stored.Rows < 0 || stored.Bytes < 0 || p.reference(stored.Scope, stored.SQL) != ref {
		return nil, ErrAccessDenied
	}
	return &stored, nil
}

func (p *PreAggregator) lookup(ctx context.Context, ref preAggregateRef) (*preAggregateMetadata, error) {
	var comment sql.NullString
	err := p.db.db.QueryRowContext(ctx, `SELECT comment FROM system.main.duckdb_tables()
WHERE database_name = ? AND schema_name = ? AND table_name = ? AND NOT temporary`, ref.catalog, ref.schema, ref.table).Scan(&comment)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return p.metadata(ref, comment)
}

func (p *PreAggregator) materialize(ctx context.Context, ref preAggregateRef, scope, source string) (PreaggResponse, error) {
	// Another build may have committed between the first lookup and lane admission.
	stored, err := p.lookup(ctx, ref)
	if err != nil {
		return PreaggResponse{}, err
	}
	if stored != nil && p.usable(stored) {
		return p.response(ref, stored), nil
	}
	conn, err := p.db.db.Conn(ctx)
	if err != nil {
		return PreaggResponse{}, err
	}
	defer conn.Close()
	tx, err := conn.BeginTx(ctx, nil)
	if err != nil {
		return PreaggResponse{}, err
	}
	defer tx.Rollback()

	if err := p.prune(ctx, tx, ref); err != nil {
		return PreaggResponse{}, err
	}
	if _, err := tx.ExecContext(ctx, "CREATE SCHEMA IF NOT EXISTS "+quoteIdentifier(ref.catalog)+"."+quoteIdentifier(ref.schema)); err != nil {
		return PreaggResponse{}, err
	}
	if _, err := tx.ExecContext(ctx, "CREATE TABLE "+ref.String()+" AS "+source); err != nil {
		return PreaggResponse{}, err
	}
	rows, size, err := p.measure(ctx, conn, ref)
	if err != nil {
		return PreaggResponse{}, err
	}
	stored = &preAggregateMetadata{1, scope, source, time.Now().UTC(), rows, size}
	comment, err := json.Marshal(stored)
	if err != nil {
		return PreaggResponse{}, err
	}
	if _, err := tx.ExecContext(ctx, "COMMENT ON TABLE "+ref.String()+" IS "+quoteLiteral(string(comment))); err != nil {
		return PreaggResponse{}, err
	}
	if err := tx.Commit(); err != nil {
		return PreaggResponse{}, err
	}
	return p.response(ref, stored), nil
}

func (p *PreAggregator) prune(ctx context.Context, tx *sql.Tx, target preAggregateRef) error {
	rows, err := tx.QueryContext(ctx, `SELECT schema_name, table_name, comment FROM system.main.duckdb_tables()
WHERE database_name = ? AND starts_with(schema_name, 'mosaic_preagg_') AND NOT temporary`, p.catalog)
	if err != nil {
		return err
	}
	var tables []storedPreAggregate
	for rows.Next() {
		ref := preAggregateRef{catalog: p.catalog}
		var comment sql.NullString
		if err := rows.Scan(&ref.schema, &ref.table, &comment); err != nil {
			rows.Close()
			return err
		}
		stored, err := p.metadata(ref, comment)
		if err == nil {
			tables = append(tables, storedPreAggregate{ref, *stored})
		}
	}
	err = errors.Join(rows.Err(), rows.Close())
	if err != nil {
		return err
	}
	slices.SortFunc(tables, func(a, b storedPreAggregate) int { return a.CreatedAt.Compare(b.CreatedAt) })
	counts := make(map[string]int)
	for _, table := range tables {
		counts[table.ref.schema]++
	}
	remaining := len(tables)
	var victims []preAggregateRef
	for i := range tables {
		table := &tables[i]
		if table.ref == target || !p.usable(&table.preAggregateMetadata) {
			victims = append(victims, table.ref)
			counts[table.ref.schema]--
			remaining--
		}
	}
	for _, table := range tables {
		if slices.Contains(victims, table.ref) {
			continue
		}
		if table.ref.schema == target.schema && counts[target.schema] >= p.limits.MaxTablesPerScope {
			victims = append(victims, table.ref)
			counts[table.ref.schema]--
			remaining--
		}
	}
	for _, table := range tables {
		if remaining < p.limits.MaxTables {
			break
		}
		if !slices.Contains(victims, table.ref) {
			victims = append(victims, table.ref)
			counts[table.ref.schema]--
			remaining--
		}
	}
	for _, ref := range victims {
		if _, err := tx.ExecContext(ctx, "DROP TABLE "+ref.String()); err != nil {
			return err
		}
	}
	for schema, count := range counts {
		if count == 0 && schema != target.schema {
			if _, err := tx.ExecContext(ctx, "DROP SCHEMA "+quoteIdentifier(p.catalog)+"."+quoteIdentifier(schema)); err != nil {
				return err
			}
		}
	}
	return nil
}

func quoteIdentifier(value string) string {
	return `"` + strings.ReplaceAll(value, `"`, `""`) + `"`
}
