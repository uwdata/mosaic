package query

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/duckdb/duckdb-go/v2"
)

var (
	ErrAccessDenied         = errors.New("query: access denied")
	ErrUnsupportedStatement = errors.New("query: unsupported statement")
	ErrValidation           = errors.New("query: validation failed")
)

type ValidationPolicy struct {
	// JSON passes a complete Gatekeeper document verbatim and cannot be combined with typed options.
	JSON *string `json:"-"`
	// omitzero preserves the distinction between nil (inherit) and an explicit empty allowlist.
	AllowedTables       []TableRule `json:"allowed_tables,omitzero"`
	BlockedTables       []TableRule `json:"blocked_tables,omitzero"`
	AllowedFunctions    []string    `json:"allowed_functions,omitzero"`
	BlockedFunctions    []string    `json:"blocked_functions,omitzero"`
	UseDefaultFunctions *bool       `json:"use_default_functions,omitempty"`
}

type TableRule struct {
	// Nil matches any catalog; a whole-component "*" is a wildcard in each field.
	Catalog *string `json:"catalog,omitempty"`
	Schema  string  `json:"schema"`
	Table   string  `json:"table"`
}

type Violation struct {
	Rule         string `json:"rule"`
	Message      string `json:"message"`
	Catalog      string `json:"catalog"`
	Schema       string `json:"schema"`
	Table        string `json:"table"`
	FunctionName string `json:"function_name" mapstructure:"function_name"`
	Position     *int64 `json:"position"`
}

type ErrorDetails struct {
	Code       string      `json:"code"`
	Type       string      `json:"error_type"`
	Message    string      `json:"error_message"`
	Position   *int64      `json:"position"`
	Violations []Violation `json:"violations"`
}

func (e ErrorDetails) Error() string {
	details := "query"
	if e.Type != "" {
		details += ": " + e.Type
	} else if e.Code != "" {
		details += ": " + e.Code
	}
	if e.Position != nil {
		details += fmt.Sprintf(" at %d", *e.Position)
	}
	if e.Message != "" {
		details += ": " + e.Message
	}
	for _, v := range e.Violations {
		details += ": " + v.Rule + ": " + v.Message
	}
	return details
}

func (e ErrorDetails) Is(target error) bool {
	return target == ErrAccessDenied && e.Code == "forbidden" || target == ErrUnsupportedStatement && e.Code == "unsupported"
}

type ResolvedObject struct {
	Catalog string `json:"catalog"`
	Schema  string `json:"schema"`
	Table   string `json:"table"`
	Type    string `json:"type"`
}

type ResolvedFunction struct {
	Catalog string `json:"catalog"`
	Schema  string `json:"schema"`
	Name    string `json:"name"`
	Type    string `json:"type"`
}

type ValidationResult struct {
	Allowed bool `json:"allowed"`
	ErrorDetails
	Objects       []ResolvedObject   `json:"objects"`
	Functions     []ResolvedFunction `json:"functions"`
	CallerObjects []ResolvedObject   `json:"caller_objects"`
}

// InspectSQL returns binding evidence on success and structured diagnostics on denial. It does not reserve a connection for execution.
func (db *DB) InspectSQL(ctx context.Context, query string, policy ValidationPolicy) (ValidationResult, error) {
	result, err := db.inspectSQL(ctx, db.db, query, policy)
	if err != nil {
		return result, fmt.Errorf("%w: %w", ErrValidation, err)
	}
	return result, nil
}

// ValidateSQL validates without executing. QueryArrow and WriteArrow validate and execute on the same connection.
func (db *DB) ValidateSQL(ctx context.Context, query string, policy ValidationPolicy) error {
	return db.validateSQL(ctx, db.db, query, policy)
}

type rowQuerier interface {
	QueryRowContext(context.Context, string, ...any) *sql.Row
}

func (db *DB) validateSQL(ctx context.Context, conn rowQuerier, query string, policy ValidationPolicy) error {
	if _, err := db.inspectSQL(ctx, conn, query, policy); err != nil {
		return fmt.Errorf("%w: %w", ErrValidation, err)
	}
	return nil
}

func (db *DB) inspectSQL(ctx context.Context, conn rowQuerier, query string, policy ValidationPolicy) (ValidationResult, error) {
	var result ValidationResult
	document, err := policy.document()
	if err != nil {
		return result, err
	}
	const stmt = `SELECT allowed, code, error_type, error_message, position, violations, objects, functions, caller_objects
		FROM system.main.gatekeeper_validate($sql, json := $policy)`
	var violations duckdb.Composite[[]Violation]
	var objects, callers duckdb.Composite[[]ResolvedObject]
	var functions duckdb.Composite[[]ResolvedFunction]
	if err := conn.QueryRowContext(ctx, stmt, sql.Named("sql", query), sql.Named("policy", document)).Scan(
		&result.Allowed, &result.Code, &result.Type, &result.Message, &result.Position,
		&violations, &objects, &functions, &callers,
	); err != nil {
		return result, fmt.Errorf("query: Gatekeeper validation failed: %w", err)
	}
	result.Violations = violations.Get()
	result.Objects, result.Functions, result.CallerObjects = objects.Get(), functions.Get(), callers.Get()
	if result.Allowed && result.Code == "ok" && len(result.Violations) == 0 {
		return result, nil
	}
	if result.Allowed {
		return result, errors.New("query: inconsistent Gatekeeper response")
	}
	switch result.Code {
	case "forbidden", "unsupported", "parser", "binding", "invalid_input":
	default:
		return result, fmt.Errorf("query: unexpected Gatekeeper result code %q", result.Code)
	}
	return result, result.ErrorDetails
}

func ConfigureGatekeeper(ctx context.Context, execer driver.ExecerContext, document string) error {
	_, err := execer.ExecContext(ctx, "CALL system.main.gatekeeper_configure(json := $1)", []driver.NamedValue{{Ordinal: 1, Value: document}})
	return err
}

func (policy ValidationPolicy) document() (string, error) {
	if policy.JSON != nil {
		if policy.AllowedTables != nil || policy.BlockedTables != nil || policy.AllowedFunctions != nil || policy.BlockedFunctions != nil || policy.UseDefaultFunctions != nil {
			return "", errors.New("query: JSON policy cannot be combined with typed options")
		}
		return *policy.JSON, nil
	}
	document, err := json.Marshal(struct {
		Version int              `json:"version"`
		Options ValidationPolicy `json:"options"`
	}{Version: 1, Options: policy})
	return string(document), err
}
