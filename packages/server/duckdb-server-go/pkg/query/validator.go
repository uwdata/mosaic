package query

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
)

var (
	ErrAccessDenied         = errors.New("query: access denied")
	ErrUnsupportedStatement = errors.New("query: unsupported statement")
	ErrValidation           = errors.New("query: validation failed")
)

// ValidationPolicy is the per-request half of Gatekeeper's policy. Gatekeeper intersects it with the database-wide
// ceiling set by gatekeeper_configure, so a request can only narrow what trusted initialization already admits.
type ValidationPolicy struct {
	// AllowedSchemas restricts tables and views to these schemas of the primary catalog captured by New. Nil adds no
	// object restriction; an empty slice denies caller table and view references. Trusted definitions expose their own dependencies.
	AllowedSchemas []string

	// AllowedFunctions is passed as Gatekeeper's allowed_functions. Nil omits the argument so the request inherits the
	// global allowlist, including any gatekeeper_configure grants; a non-nil slice (even empty) intersects with it.
	AllowedFunctions []string

	// BlockedFunctions are denied for caller expressions in addition to any globally blocked functions.
	BlockedFunctions []string

	// DisableDefaultFunctions passes use_default_functions := false so only explicitly allowed functions remain.
	DisableDefaultFunctions bool
}

type Violation struct {
	Rule         string `json:"rule"`
	Message      string `json:"message"`
	Catalog      string `json:"catalog"`
	Schema       string `json:"schema"`
	Table        string `json:"table"`
	FunctionName string `json:"function_name"`
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
	return target == ErrAccessDenied && e.Code == "forbidden" ||
		target == ErrUnsupportedStatement && e.Code == "unsupported"
}

// ValidateSQL runs Gatekeeper on any pooled connection without executing the query. Use QueryArrow or WriteArrow with
// a policy to validate and execute on the same connection.
func (db *DB) ValidateSQL(ctx context.Context, query string, policy ValidationPolicy) error {
	return db.validateSQL(ctx, db.db, query, policy)
}

type rowQuerier interface {
	QueryRowContext(context.Context, string, ...any) *sql.Row
}

func (db *DB) validateSQL(ctx context.Context, conn rowQuerier, query string, policy ValidationPolicy) error {
	if err := db.checkSQL(ctx, conn, query, policy); err != nil {
		return fmt.Errorf("%w: %w", ErrValidation, err)
	}
	return nil
}

func (db *DB) checkSQL(ctx context.Context, conn rowQuerier, query string, policy ValidationPolicy) error {
	stmt := `SELECT CAST(system.main.to_json(result) AS VARCHAR) FROM system.main.gatekeeper_validate($sql,
		blocked_functions := $blocked::VARCHAR[]`
	args := []any{sql.Named("sql", query), sql.Named("blocked", NormalizeFunctionNames(policy.BlockedFunctions))}
	if policy.AllowedSchemas != nil {
		for _, schema := range policy.AllowedSchemas {
			if schema == "*" || db.catalog == "*" {
				return ErrorDetails{Code: "invalid_input", Message: "schema policies require exact catalog and schema names"}
			}
		}
		stmt += `, allowed_tables := system.main.list_transform($schemas::VARCHAR[], lambda s: {'catalog': $catalog::VARCHAR, 'schema': s, 'table': '*'})`
		args = append(args, sql.Named("schemas", policy.AllowedSchemas), sql.Named("catalog", db.catalog))
	}
	if policy.AllowedFunctions != nil {
		stmt += ", allowed_functions := $allowed::VARCHAR[]"
		args = append(args, sql.Named("allowed", NormalizeFunctionNames(policy.AllowedFunctions)))
	}
	if policy.DisableDefaultFunctions {
		stmt += ", use_default_functions := false"
	}
	stmt += ") AS result"
	var raw string
	if err := conn.QueryRowContext(ctx, stmt, args...).Scan(&raw); err != nil {
		return fmt.Errorf("query: Gatekeeper validation failed: %w", err)
	}
	var result struct {
		Allowed *bool `json:"allowed"`
		ErrorDetails
	}
	if err := json.Unmarshal([]byte(raw), &result); err != nil {
		return fmt.Errorf("query: invalid Gatekeeper response: %w", err)
	}
	if result.Allowed != nil && *result.Allowed && result.Code == "ok" && len(result.Violations) == 0 {
		return nil
	}
	if result.Allowed == nil || *result.Allowed {
		return errors.New("query: inconsistent Gatekeeper response")
	}
	switch result.Code {
	case "forbidden", "unsupported", "parser", "binding", "invalid_input":
	default:
		return fmt.Errorf("query: unexpected Gatekeeper result code %q", result.Code)
	}
	return result.ErrorDetails
}
