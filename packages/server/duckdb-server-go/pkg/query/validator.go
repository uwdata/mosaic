package query

import (
	"context"
	"database/sql"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/functionset/remoteread"
)

var (
	ErrAccessDenied         = errors.New("query: access denied")
	ErrUnsupportedStatement = errors.New("query: unsupported statement")
)

//go:embed validate.sql
var validationSQL string

type ValidationPolicy struct {
	CheckSchemas            bool
	AllowedSchemas          []string
	BlockedFunctions        []string
	CheckFunctions          bool
	AllowedFunctions        []string
	RejectRemoteURILiterals bool
}

var remoteReadersJSON = func() string {
	readers := make(map[string]remoteread.PathArguments)
	for _, name := range remoteread.FunctionNames() {
		readers[name], _ = remoteread.Lookup(name)
	}
	data, err := json.Marshal(readers)
	if err != nil {
		panic(err)
	}
	return string(data)
}()

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

func (db *DB) ValidateSQL(ctx context.Context, query string, policy ValidationPolicy) error {
	if policy.CheckFunctions && len(policy.BlockedFunctions) > 0 {
		return errors.New("query: function allowlist and blocklist cannot both be configured")
	}
	return db.validatePrepared(ctx, query, policy)
}

func (db *DB) validateSQL(ctx context.Context, statement, query string, policy ValidationPolicy) error {
	args := []any{
		sql.Named("query", query),
		sql.Named("check_schemas", policy.CheckSchemas),
		sql.Named("allowed_schemas", policy.AllowedSchemas),
		sql.Named("blocked_functions", policy.BlockedFunctions),
		sql.Named("check_functions", policy.CheckFunctions),
		sql.Named("allowed_functions", policy.AllowedFunctions),
		sql.Named("reject_remote_uris", policy.RejectRemoteURILiterals),
		sql.Named("remote_readers", remoteReadersJSON),
	}
	rows, err := db.db.QueryContext(ctx, statement, args...)
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

func quoteLiteral(s string) string {
	return "'" + strings.ReplaceAll(s, "'", "''") + "'"
}
