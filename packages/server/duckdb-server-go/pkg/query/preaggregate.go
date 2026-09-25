package query

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"slices"
	"strings"
	"time"

	"github.com/duckdb/duckdb-go/v2"
)

var managedTableName = regexp.MustCompile(`preagg_[0-9a-f]{64}`)

// Namespace is the catalog and schema path a caller's managed tables live in. The server owns every object in it. An
// empty Catalog means the database's current catalog. DuckDB schemas have one level; nested paths need engine support
// and Gatekeeper 0.4.
type Namespace struct {
	Catalog string
	Schema  []string
}

// Reference names a managed table or view. Schema is the namespace path, outermost first, as on the wire.
type Reference struct {
	Catalog string   `json:"catalog"`
	Schema  []string `json:"schema"`
	Table   string   `json:"table"`
}

func (r Reference) String() string {
	parts := make([]string, 0, len(r.Schema)+2)
	for _, part := range append(append([]string{r.Catalog}, r.Schema...), r.Table) {
		parts = append(parts, quoteIdentifier(part))
	}
	return strings.Join(parts, ".")
}

// DuckDB compares identifiers case-insensitively, so two spellings of one object are the same reference.
func (r Reference) equal(o Reference) bool {
	return strings.EqualFold(r.Catalog, o.Catalog) && strings.EqualFold(r.Table, o.Table) && slices.EqualFunc(r.Schema, o.Schema, strings.EqualFold)
}

func (r Reference) in(ns Namespace) bool {
	return strings.EqualFold(r.Catalog, ns.Catalog) && slices.EqualFunc(r.Schema, ns.Schema, strings.EqualFold)
}

// schema is the single DuckDB schema component; callers have already validated the path depth.
func (r Reference) schema() string {
	return r.Schema[0]
}

// Stats describe a published table as cheaply as its storage allows. Rows is required; Bytes is a ballpark from
// footers or column widths, never a scan, and 0 means unknown.
type Stats struct {
	Rows  int64 `json:"rows"`
	Bytes int64 `json:"bytes,omitempty"`
}

// Materializer owns the physical form of a managed table. Materialize runs inside tx, which has already validated
// source on its connection, so source binds identically here; it must leave a table or view named ref.
type Materializer interface {
	Materialize(ctx context.Context, tx *sql.Tx, ref Reference, source string) (Stats, error)
}

type PreaggResponse struct {
	Reference Reference `json:"reference"`
	CreatedAt time.Time `json:"createdAt"`
	Stats
}

type MissingPreAggregateError struct {
	Reference Reference
}

func (e *MissingPreAggregateError) Error() string {
	return "Materialized table is unavailable"
}

func missing(ref Reference) error {
	return &MissingPreAggregateError{Reference: ref}
}

// SourcePolicy returns the validation policy for a stored source SELECT that a read depends on.
type SourcePolicy func(ctx context.Context, sql string) (*ValidationPolicy, error)

type PreAggregator struct {
	db           *DB
	catalog      string
	materializer Materializer
}

type preAggregateMetadata struct {
	Version   int       `json:"version"`
	SQL       string    `json:"sql"`
	CreatedAt time.Time `json:"createdAt"`
	Stats
}

// NewPreAggregator requires a DB built with WithValidation: Gatekeeper is the only statement authority, so source
// SELECTs and reads of managed tables are never inspected in Go. A nil materializer uses TableMaterializer.
func NewPreAggregator(ctx context.Context, db *DB, materializer Materializer) (*PreAggregator, error) {
	if db == nil {
		return nil, errors.New("query: database is required")
	}
	if !db.validation {
		return nil, errors.New("query: preaggregation requires WithValidation")
	}
	if materializer == nil {
		materializer = TableMaterializer{}
	}
	var catalog string
	if err := db.db.QueryRowContext(ctx, "SELECT current_database()").Scan(&catalog); err != nil {
		return nil, err
	}
	return &PreAggregator{db: db, catalog: catalog, materializer: materializer}, nil
}

func (p *PreAggregator) namespace(ns Namespace) (Namespace, error) {
	if ns.Catalog == "" {
		ns.Catalog = p.catalog
	}
	if len(ns.Schema) != 1 {
		return ns, errors.New("query: preaggregation namespace needs exactly one schema component on this engine")
	}
	if ns.Schema[0] == "" || strings.ContainsRune(ns.Catalog+ns.Schema[0], 0) {
		return ns, errors.New("query: invalid preaggregation namespace")
	}
	return ns, nil
}

func (p *PreAggregator) reference(ns Namespace, sql string) Reference {
	return Reference{Catalog: ns.Catalog, Schema: slices.Clone(ns.Schema), Table: fmt.Sprintf("preagg_%x", sha256.Sum256([]byte(sql)))}
}

// Materialize publishes sql as a table in ns and returns its reference. policy is the caller's request policy; nil
// applies the global Gatekeeper ceiling alone.
func (p *PreAggregator) Materialize(ctx context.Context, ns Namespace, sql string, policy *ValidationPolicy) (PreaggResponse, error) {
	ns, err := p.namespace(ns)
	if err != nil {
		return PreaggResponse{}, err
	}
	source, err := typedPolicy(policy)
	if err != nil {
		return PreaggResponse{}, err
	}
	ref := p.reference(ns, sql)
	conn, err := p.db.db.Conn(ctx)
	if err != nil {
		return PreaggResponse{}, err
	}
	defer func() { _ = conn.Close() }()
	for {
		stored, err := p.attempt(ctx, conn, ns, ref, sql, source)
		if err == nil {
			return p.response(ref, stored), nil
		}
		var conflict *duckdb.Error
		if !errors.As(err, &conflict) || conflict.Type != duckdb.ErrorTypeTransaction || ctx.Err() != nil {
			return PreaggResponse{}, err
		}
		// Concurrent callers race on the schema and table. A loser whose reference now exists returns the winner's;
		// a loser of only the schema retries against the committed schema.
		if stored, lookupErr := p.lookup(ctx, conn, ref); lookupErr == nil && stored != nil {
			return p.response(ref, stored), nil
		}
	}
}

func (p *PreAggregator) attempt(ctx context.Context, conn *sql.Conn, ns Namespace, ref Reference, sql string, policy ValidationPolicy) (*preAggregateMetadata, error) {
	tx, err := conn.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()
	if _, err := p.authorize(ctx, tx, sql, policy, true); err != nil {
		return nil, err
	}
	stored, err := p.lookup(ctx, tx, ref)
	if errors.Is(err, errUnmanaged) {
		return nil, ErrAccessDenied
	}
	if err != nil || stored != nil {
		return stored, err
	}
	if _, err := tx.ExecContext(ctx, "CREATE SCHEMA IF NOT EXISTS "+quoteIdentifier(ref.Catalog)+"."+quoteIdentifier(ref.schema())); err != nil {
		return nil, err
	}
	stats, err := p.materializer.Materialize(ctx, tx, ref, sql)
	if err != nil {
		return nil, err
	}
	stored = &preAggregateMetadata{1, sql, time.Now().UTC(), stats}
	comment, err := json.Marshal(stored)
	if err != nil {
		return nil, err
	}
	var kind string
	if err := tx.QueryRowContext(ctx, "SELECT upper(kind) FROM ("+managedObjects+") WHERE lower(database_name) = lower(?) AND lower(schema_name) = lower(?) AND lower(name) = lower(?)", ref.Catalog, ref.schema(), ref.Table).Scan(&kind); err != nil {
		return nil, err
	}
	if _, err := tx.ExecContext(ctx, "COMMENT ON "+kind+" "+ref.String()+" IS "+quoteLiteral(string(comment))); err != nil {
		return nil, err
	}
	return stored, tx.Commit()
}

// Query validates and executes sql on one connection. ns is readable in addition to policy; each managed table sql
// binds must exist and have a source SELECT the caller may still run under sourcePolicy (or policy when sourcePolicy
// is nil).
func (p *PreAggregator) Query(ctx context.Context, ns Namespace, sql string, policy *ValidationPolicy, sourcePolicy SourcePolicy) ([]byte, error) {
	ns, err := p.namespace(ns)
	if err != nil {
		return nil, err
	}
	read, err := typedPolicy(policy)
	if err != nil {
		return nil, err
	}
	if read.AllowedTables != nil {
		read.AllowedTables = append(slices.Clone(read.AllowedTables), TableRule{Catalog: &ns.Catalog, Schema: ns.Schema[0], Table: "*"})
	}
	conn, err := p.db.db.Conn(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = conn.Close() }()
	refs, err := p.authorize(ctx, conn, sql, read, false)
	if err != nil {
		return nil, p.missingFromBinding(ctx, conn, ns, err)
	}
	var managed []Reference
	for _, ref := range refs {
		stored, err := p.lookup(ctx, conn, ref)
		switch {
		case errors.Is(err, errUnmanaged) && !ref.in(ns):
			continue
		case errors.Is(err, errUnmanaged):
			return nil, ErrAccessDenied
		case err != nil:
			return nil, err
		case stored == nil:
			return nil, missing(ref)
		}
		managed = append(managed, ref)
		source := policy
		if sourcePolicy != nil {
			if source, err = sourcePolicy(ctx, stored.SQL); err != nil {
				return nil, err
			}
		}
		if err := p.authorizeSource(ctx, conn, stored.SQL, source); err != nil {
			return nil, err
		}
	}
	data, err := p.db.arrow(ctx, conn, sql)
	if err != nil {
		for _, ref := range managed {
			if stored, lookupErr := p.lookup(ctx, conn, ref); lookupErr == nil && stored == nil {
				return nil, missing(ref)
			}
		}
		return nil, err
	}
	return data, nil
}

// A dropped managed table fails DuckDB's bind before Gatekeeper reports any objects, so the Catalog error message is
// the only place its name appears.
func (p *PreAggregator) missingFromBinding(ctx context.Context, conn rowQuerier, ns Namespace, err error) error {
	var details ErrorDetails
	if !errors.As(err, &details) || details.Type != "Catalog" {
		return err
	}
	name := managedTableName.FindString(details.Message)
	if name == "" {
		return err
	}
	ref := Reference{ns.Catalog, slices.Clone(ns.Schema), name}
	if stored, lookupErr := p.lookup(ctx, conn, ref); lookupErr == nil && stored == nil {
		return missing(ref)
	}
	return err
}

func (p *PreAggregator) authorizeSource(ctx context.Context, conn rowQuerier, sql string, policy *ValidationPolicy) error {
	source, err := typedPolicy(policy)
	if err != nil {
		return err
	}
	_, err = p.authorize(ctx, conn, sql, source, true)
	return err
}

// authorize validates sql on conn and returns the tables it binds. A materialization may not depend on a managed
// table in any namespace, which is recognized by its metadata rather than its location.
func (p *PreAggregator) authorize(ctx context.Context, conn rowQuerier, sql string, policy ValidationPolicy, materialize bool) ([]Reference, error) {
	result, err := p.db.validateSQL(ctx, conn, sql, policy)
	if err != nil {
		return nil, err
	}
	var refs []Reference
	for _, object := range result.Objects {
		ref := Reference{object.Catalog, []string{object.Schema}, object.Table}
		if materialize {
			if stored, err := p.lookup(ctx, conn, ref); err == nil && stored != nil {
				return nil, ErrAccessDenied
			}
		}
		refs = append(refs, ref)
	}
	return refs, nil
}

func typedPolicy(policy *ValidationPolicy) (ValidationPolicy, error) {
	if policy == nil {
		return ValidationPolicy{}, nil
	}
	if policy.JSON != nil {
		return ValidationPolicy{}, fmt.Errorf("%w: preaggregation requires typed request policies", ErrInvalidPolicy)
	}
	return *policy, nil
}

func (p *PreAggregator) response(ref Reference, stored *preAggregateMetadata) PreaggResponse {
	return PreaggResponse{ref, stored.CreatedAt, stored.Stats}
}

const managedObjects = `SELECT database_name, schema_name, table_name AS name, comment, temporary, 'table' AS kind FROM system.main.duckdb_tables()
UNION ALL SELECT database_name, schema_name, view_name, comment, temporary, 'view' FROM system.main.duckdb_views()`

var errUnmanaged = errors.New("query: object was not published by this server")

// lookup returns the metadata of a managed object, nil when absent, and errUnmanaged when an object with that name
// exists but was not published by this server for that SQL.
func (p *PreAggregator) lookup(ctx context.Context, conn rowQuerier, ref Reference) (*preAggregateMetadata, error) {
	var comment sql.NullString
	err := conn.QueryRowContext(ctx, "SELECT comment FROM ("+managedObjects+`)
WHERE lower(database_name) = lower(?) AND lower(schema_name) = lower(?) AND lower(name) = lower(?) AND NOT temporary`, ref.Catalog, ref.schema(), ref.Table).Scan(&comment)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var stored preAggregateMetadata
	if !comment.Valid || json.Unmarshal([]byte(comment.String), &stored) != nil || stored.Version != 1 || stored.CreatedAt.IsZero() || !p.reference(Namespace{ref.Catalog, ref.Schema}, stored.SQL).equal(ref) {
		return nil, errUnmanaged
	}
	return &stored, nil
}

func quoteIdentifier(value string) string {
	return `"` + strings.ReplaceAll(value, `"`, `""`) + `"`
}

func quoteLiteral(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "''") + "'"
}
