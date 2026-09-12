package query

import (
	"context"
	"database/sql"
	"database/sql/driver"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"

	"github.com/duckdb/duckdb-go/v2"
	"golang.org/x/sync/semaphore"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/functionset/remoteread"
)

var (
	ErrAccessDenied         = errors.New("query: access denied")
	ErrUnsupportedStatement = errors.New("query: unsupported statement")
)

//go:embed validate.sql
var validationSQL string

// serializeCall is the fragment tests replace to validate a pre-serialized AST instead of SQL text.
const serializeCall = "(SELECT system.main.json_serialize_sql(@@request@@()->>'query',\n" +
	"                    skip_default := true, skip_empty := true, skip_null := true))"

const requestFunctionName = "mosaic_validation_request"

// requestSlots maps a validation connection's slot id to its pending request. Registered scalar functions are
// database-global, so a single UDF serves every connection and the prepared SQL passes its slot id as a literal.
var (
	requestSlots       sync.Map
	requestSlotCounter atomic.Uint64
)

var remoteURIPrefixes = []string{
	"http://", "https://", "s3://", "s3a://", "s3n://", "gcs://", "gs://",
	"r2://", "hf://", "azure://", "az://", "abfs://", "abfss://",
}

type ValidationPolicy struct {
	CheckSchemas            bool
	AllowedSchemas          []string
	BlockedFunctions        []string
	CheckFunctions          bool
	AllowedFunctions        []string
	RejectRemoteURILiterals bool
}

type ErrorDetails struct {
	Type     string `json:"error_type"`
	Subtype  string `json:"error_subtype"`
	Message  string `json:"error_message"`
	Position string `json:"position"`
}

func (e ErrorDetails) Error() string {
	details := "query"
	if e.Type != "" {
		details += ": " + e.Type
	}
	if e.Subtype != "" {
		details += " (" + e.Subtype + ")"
	}
	if e.Position != "" {
		details += " at " + e.Position
	}
	if e.Message != "" {
		details += ": " + e.Message
	}
	return details
}

func (e ErrorDetails) Is(target error) bool {
	return target == ErrUnsupportedStatement && strings.EqualFold(e.Type, "not implemented")
}

// validationRequest is the per-request input the SQL reads back through the request UDF.
type validationRequest struct {
	Query          string   `json:"query"`
	CheckSchemas   bool     `json:"check_schemas"`
	AllowedSchemas []string `json:"allowed_schemas"`
}

// requestUDF returns the JSON-encoded validationRequest stored in the given slot. Volatile keeps DuckDB from folding
// it at bind time, so one prepared plan serves every request. The driver pins UDF bind data, including any captured
// context, on first execution, so the request cannot travel via context.Context.
type requestUDF struct{}

func (requestUDF) Config() duckdb.ScalarFuncConfig {
	ubigint, err := duckdb.NewTypeInfo(duckdb.TYPE_UBIGINT)
	if err != nil {
		panic(err)
	}
	varchar, err := duckdb.NewTypeInfo(duckdb.TYPE_VARCHAR)
	if err != nil {
		panic(err)
	}
	return duckdb.ScalarFuncConfig{InputTypeInfos: []duckdb.TypeInfo{ubigint}, ResultTypeInfo: varchar, Volatile: true}
}

func (requestUDF) Executor() duckdb.ScalarFuncExecutor {
	return duckdb.ScalarFuncExecutor{
		RowExecutor: func(values []driver.Value) (any, error) {
			slot, _ := values[0].(uint64)
			request, ok := requestSlots.Load(slot)
			if !ok {
				return nil, fmt.Errorf("query: validation request slot %d not set", slot)
			}
			return request.(string), nil
		},
	}
}

// validationPool keeps idle connections whose prepared statement was rendered for one server-level policy.
type validationPool struct {
	statement string
	idle      chan *validationConn
}

type validationConn struct {
	set  *validatorSet
	conn *sql.Conn
	stmt *sql.Stmt
	slot uint64
}

// validatorSet owns a private in-memory DuckDB for validation and caps its connections with one semaphore shared by
// every policy pool; an idle connection of another pool is closed when a new one is needed at the cap.
type validatorSet struct {
	db          *sql.DB
	connector   *duckdb.Connector
	sem         *semaphore.Weighted
	open        atomic.Int64
	maxConns    int64
	registerUDF sync.Once
	registerErr error
	pools       sync.Map // poolKey -> *validationPool

	mu      sync.Mutex
	changed chan struct{} // closed and replaced whenever a connection is released or closed
}

type poolKey struct {
	template         string
	blockedFunctions string
	checkFunctions   bool
	allowedFunctions string
	rejectRemoteURIs bool
}

// The validation database never executes submitted SQL, so it needs none of the query database's catalog,
// extensions, or settings, and a single worker thread is fastest for these plans.
func newValidatorSet(ctx context.Context, maxConns int) (*validatorSet, error) {
	connector, err := duckdb.NewConnector(":memory:?threads=1", nil)
	if err != nil {
		return nil, fmt.Errorf("query: failed to open validation database: %w", err)
	}
	db := sql.OpenDB(connector)
	db.SetMaxOpenConns(maxConns)
	db.SetMaxIdleConns(maxConns)
	v := &validatorSet{
		db: db, connector: connector, maxConns: int64(maxConns),
		sem:     semaphore.NewWeighted(int64(maxConns)),
		changed: make(chan struct{}),
	}
	if err := db.PingContext(ctx); err != nil {
		v.Close()
		return nil, fmt.Errorf("query: failed to initialize validation database: %w", err)
	}
	return v, nil
}

func (v *validatorSet) pool(template string, policy ValidationPolicy) *validationPool {
	key := poolKey{
		template:         template,
		blockedFunctions: strings.Join(policy.BlockedFunctions, "\x00"),
		checkFunctions:   policy.CheckFunctions,
		allowedFunctions: strings.Join(policy.AllowedFunctions, "\x00"),
		rejectRemoteURIs: policy.RejectRemoteURILiterals,
	}
	if existing, ok := v.pools.Load(key); ok {
		return existing.(*validationPool)
	}
	pool := &validationPool{
		statement: renderValidationSQL(template, policy),
		idle:      make(chan *validationConn, v.maxConns),
	}
	actual, _ := v.pools.LoadOrStore(key, pool)
	return actual.(*validationPool)
}

func (v *validatorSet) acquire(ctx context.Context, pool *validationPool) (*validationConn, error) {
	if err := v.sem.Acquire(ctx, 1); err != nil {
		return nil, err
	}
	for {
		v.mu.Lock()
		changed := v.changed
		v.mu.Unlock()
		select {
		case vc := <-pool.idle:
			return vc, nil
		default:
		}
		if v.open.Load() < v.maxConns {
			vc, err := v.connect(ctx, pool.statement)
			if err != nil {
				v.sem.Release(1)
				return nil, err
			}
			return vc, nil
		}
		// Holding a semaphore slot without a connection means another pool holds an idle one, or a connection is
		// still being released or closed; wait for the next change and re-check.
		if v.evictIdle(pool) {
			continue
		}
		select {
		case vc := <-pool.idle:
			return vc, nil
		case <-changed:
		case <-ctx.Done():
			v.sem.Release(1)
			return nil, ctx.Err()
		}
	}
}

func (v *validatorSet) broadcast() {
	v.mu.Lock()
	close(v.changed)
	v.changed = make(chan struct{})
	v.mu.Unlock()
}

func (v *validatorSet) evictIdle(except *validationPool) bool {
	evicted := false
	v.pools.Range(func(_, value any) bool {
		pool := value.(*validationPool)
		if pool == except {
			return true
		}
		select {
		case vc := <-pool.idle:
			vc.close()
			evicted = true
			return false
		default:
			return true
		}
	})
	return evicted
}

func (v *validatorSet) release(pool *validationPool, vc *validationConn) {
	select {
	case pool.idle <- vc:
		v.broadcast()
	default:
		vc.close()
	}
	v.sem.Release(1)
}

func (v *validatorSet) connect(ctx context.Context, statement string) (*validationConn, error) {
	conn, err := v.db.Conn(ctx)
	if err != nil {
		return nil, fmt.Errorf("query: failed to open validation connection: %w", err)
	}
	v.open.Add(1)
	v.registerUDF.Do(func() {
		v.registerErr = duckdb.RegisterScalarUDF(conn, requestFunctionName, &requestUDF{})
	})
	if v.registerErr != nil {
		v.closeConn(conn)
		return nil, fmt.Errorf("query: failed to register validation function: %w", v.registerErr)
	}
	vc := &validationConn{set: v, conn: conn, slot: requestSlotCounter.Add(1)}
	call := fmt.Sprintf("main.%s(%d::UBIGINT)", requestFunctionName, vc.slot)
	vc.stmt, err = conn.PrepareContext(ctx, strings.ReplaceAll(statement, "@@request@@()", call))
	if err != nil {
		v.closeConn(conn)
		return nil, fmt.Errorf("query: failed to prepare validation statement: %w", err)
	}
	return vc, nil
}

func (v *validatorSet) closeConn(conn *sql.Conn) {
	conn.Close()
	v.open.Add(-1)
	v.broadcast()
}

func (vc *validationConn) close() {
	requestSlots.Delete(vc.slot)
	vc.stmt.Close()
	vc.set.closeConn(vc.conn)
}

func (v *validatorSet) Close() error {
	v.pools.Range(func(_, value any) bool {
		pool := value.(*validationPool)
		for {
			select {
			case vc := <-pool.idle:
				vc.close()
			default:
				return true
			}
		}
	})
	if err := v.db.Close(); err != nil {
		return err
	}
	return v.connector.Close()
}

func (db *DB) ValidateSQL(ctx context.Context, query string, policy ValidationPolicy) error {
	if policy.CheckFunctions && len(policy.BlockedFunctions) > 0 {
		return errors.New("query: function allowlist and blocklist cannot both be configured")
	}
	return db.validateSQL(ctx, validationSQL, query, policy)
}

func (db *DB) validateSQL(ctx context.Context, template, query string, policy ValidationPolicy) error {
	request, err := json.Marshal(validationRequest{
		Query:          query,
		CheckSchemas:   policy.CheckSchemas,
		AllowedSchemas: policy.AllowedSchemas,
	})
	if err != nil {
		return fmt.Errorf("query: failed to encode validation request: %w", err)
	}

	pool := db.validators.pool(template, policy)
	vc, err := db.validators.acquire(ctx, pool)
	if err != nil {
		return fmt.Errorf("query: failed to acquire validation connection: %w", err)
	}
	defer db.validators.release(pool, vc)

	requestSlots.Store(vc.slot, string(request))
	rows, err := vc.stmt.QueryContext(ctx)
	if err != nil {
		return fmt.Errorf("query: failed to validate SQL: %w", err)
	}
	return readValidationResult(rows)
}

func readValidationResult(rows *sql.Rows) error {
	defer rows.Close()

	var errs []error
	seen := false
	for rows.Next() {
		seen = true
		var code string
		var details ErrorDetails
		if err := rows.Scan(&code, &details.Type, &details.Subtype, &details.Message, &details.Position); err != nil {
			return fmt.Errorf("query: failed to read validation result: %w", err)
		}
		switch code {
		case "ok":
		case "forbidden":
			errs = append(errs, fmt.Errorf("%w: %s", ErrAccessDenied, details.Message))
		case "parser", "unsupported":
			errs = append(errs, details)
		default:
			errs = append(errs, fmt.Errorf("query: unknown validation result %q", code))
		}
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("query: failed to read validation result: %w", err)
	}
	if !seen {
		return errors.New("query: missing validation result")
	}
	return errors.Join(errs...)
}

// renderValidationSQL bakes the server-level policy into the statement so DuckDB prunes disabled branches at plan time.
func renderValidationSQL(template string, policy ValidationPolicy) string {
	return strings.NewReplacer(
		"@@blocked_functions@@", varcharList(policy.BlockedFunctions),
		"@@check_functions@@", boolLiteral(policy.CheckFunctions),
		"@@allowed_functions@@", varcharList(policy.AllowedFunctions),
		"@@reject_remote_uris@@", boolLiteral(policy.RejectRemoteURILiterals),
		"@@remote_prefixes@@", varcharList(remoteURIPrefixes),
		"@@remote_readers@@", remoteReadersLiteral(policy.RejectRemoteURILiterals),
	).Replace(template)
}

func boolLiteral(b bool) string {
	if b {
		return "true"
	}
	return "false"
}

func varcharList(values []string) string {
	quoted := make([]string, len(values))
	for i, value := range values {
		quoted[i] = quoteLiteral(value)
	}
	return "[" + strings.Join(quoted, ", ") + "]::VARCHAR[]"
}

const remoteReadersType = `MAP(VARCHAR, STRUCT("positional" BIGINT[], "named" VARCHAR[]))`

func remoteReadersLiteral(enabled bool) string {
	if !enabled {
		return "(MAP {}::" + remoteReadersType + ")"
	}
	var entries []string
	for _, name := range remoteread.FunctionNames() {
		args, _ := remoteread.Lookup(name)
		positional := make([]string, len(args.Positional))
		for i, index := range args.Positional {
			positional[i] = fmt.Sprint(index)
		}
		entries = append(entries, fmt.Sprintf("%s: {'positional': [%s]::BIGINT[], 'named': %s}",
			quoteLiteral(name), strings.Join(positional, ", "), varcharList(args.Named)))
	}
	return "(MAP {" + strings.Join(entries, ", ") + "}::" + remoteReadersType + ")"
}

func quoteLiteral(s string) string {
	return "'" + strings.ReplaceAll(s, "'", "''") + "'"
}
