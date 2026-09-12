package query

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

var (
	ErrAccessDenied         = errors.New("query: access denied")
	ErrUnsupportedStatement = errors.New("query: unsupported statement")
)

type ValidationPolicy struct {
	AllowedSchemas    []string
	BlockedFunctions  []string
	FunctionAllowlist *FunctionAllowlistOptions
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
	Subtype    string      `json:"error_subtype,omitempty"`
	Message    string      `json:"error_message"`
	Position   string      `json:"position,omitempty"`
	Violations []Violation `json:"violations"`
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
	for _, v := range e.Violations {
		details += ": " + v.Rule + ": " + v.Message
	}
	return details
}

func (e ErrorDetails) Is(target error) bool {
	return target == ErrAccessDenied && e.Code == "forbidden" ||
		target == ErrUnsupportedStatement && (e.Code == "unsupported" || strings.EqualFold(e.Type, "not implemented"))
}

func (db *DB) ValidateSQL(ctx context.Context, query string, policy ValidationPolicy) error {
	return db.validateSQL(ctx, db.db, query, policy)
}

type rowQuerier interface {
	QueryRowContext(context.Context, string, ...any) *sql.Row
}

func (db *DB) validateSQL(ctx context.Context, conn rowQuerier, query string, policy ValidationPolicy) error {
	stmt := `SELECT CAST(system.main.to_json(system.main.gatekeeper_validate($sql,
		blocked_functions := $blocked::VARCHAR[]`
	blocked := append([]string{}, policy.BlockedFunctions...)
	if policy.FunctionAllowlist != nil {
		blocked = append(blocked, policy.FunctionAllowlist.Exclude...)
	}
	args := []any{sql.Named("sql", query), sql.Named("blocked", normalizeFunctionNames(blocked))}
	if policy.AllowedSchemas != nil {
		stmt += ", allowed_schemas := $schemas::VARCHAR[], allowed_catalogs := [$catalog::VARCHAR]"
		args = append(args, sql.Named("schemas", policy.AllowedSchemas), sql.Named("catalog", db.catalog))
	}
	if policy.FunctionAllowlist != nil {
		stmt += ", allowed_functions := $allowed::VARCHAR[], use_default_functions := $defaults::BOOLEAN"
		args = append(args, sql.Named("allowed", normalizeFunctionNames(policy.FunctionAllowlist.Include)), sql.Named("defaults", !policy.FunctionAllowlist.DisableDefaults))
	}
	stmt += ")) AS VARCHAR)"
	var raw string
	if err := conn.QueryRowContext(ctx, stmt, args...).Scan(&raw); err != nil {
		return fmt.Errorf("query: Gatekeeper validation failed: %w", err)
	}
	var result struct {
		Allowed    *bool       `json:"allowed"`
		Code       string      `json:"code"`
		Type       string      `json:"error_type"`
		Message    string      `json:"error_message"`
		Position   *int64      `json:"position"`
		Violations []Violation `json:"violations"`
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
	err := ErrorDetails{Code: result.Code, Type: result.Type, Message: result.Message, Violations: result.Violations}
	if err.Type == "" {
		err.Type = result.Code
	}
	if result.Position != nil {
		err.Position = fmt.Sprint(*result.Position)
	}
	return err
}

func quoteLiteral(s string) string { return "'" + strings.ReplaceAll(s, "'", "''") + "'" }
