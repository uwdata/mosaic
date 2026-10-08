package server

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/duckdb/duckdb-go/v2"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

var (
	errMethodNotAllowed   = errors.New("server: method not allowed")
	errUnsupportedCommand = errors.New("server: unsupported command")
)

// commandError is an ErrInvalidCommand that also names the protocol reason
// and, for field reasons, the offending property.
type commandError struct {
	reason, field, message string
	cause                  error
}

func (e *commandError) Error() string {
	return ErrInvalidCommand.Error() + ": " + e.message
}

func (e *commandError) Unwrap() []error {
	return []error{ErrInvalidCommand, e.cause}
}

func malformedJSON(err error) error {
	response := &commandError{reason: "malformed_json", message: "decode request body: " + err.Error(), cause: err}
	if typeErr, ok := errors.AsType[*json.UnmarshalTypeError](err); ok && typeErr.Field != "" {
		response.reason, response.field = "invalid_field", typeErr.Field
	}
	return response
}

func missingField(field string) error {
	return &commandError{reason: "missing_field", field: field, message: "missing required '" + field + "' parameter"}
}

func invalidField(field, message string) error {
	return &commandError{reason: "invalid_field", field: field, message: message}
}

type errorResponse struct {
	status    int
	code      string
	reason    string
	field     string
	reference *query.Reference
}

func (r errorResponse) envelope(err error) map[string]any {
	result := map[string]any{"error": err.Error(), "code": r.code, "reason": r.reason}
	if r.field != "" {
		result["field"] = r.field
	}
	if r.reference != nil {
		result["reference"] = *r.reference
	}
	return result
}

func classifyError(err error) errorResponse {
	tooLarge, _ := errors.AsType[*http.MaxBytesError](err)
	command, _ := errors.AsType[*commandError](err)
	typeErr, _ := errors.AsType[*json.UnmarshalTypeError](err)
	missing, _ := errors.AsType[*query.MissingPreAggregateError](err)
	details, isDetails := errors.AsType[query.ErrorDetails](err)
	engine, isEngine := errors.AsType[*duckdb.Error](err)
	switch {
	case tooLarge != nil:
		return errorResponse{status: http.StatusRequestEntityTooLarge, code: "bad_request", reason: "payload_too_large"}
	case errors.Is(err, errMethodNotAllowed):
		return errorResponse{status: http.StatusMethodNotAllowed, code: "bad_request", reason: "method_not_allowed"}
	case errors.Is(err, ErrUnauthenticated):
		return errorResponse{status: http.StatusUnauthorized, code: "unauthenticated", reason: "authentication_required"}
	case errors.Is(err, ErrPermissionDenied):
		return errorResponse{status: http.StatusForbidden, code: "forbidden", reason: "access_denied"}
	case command != nil:
		return errorResponse{status: http.StatusBadRequest, code: "bad_request", reason: command.reason, field: command.field}
	case errors.Is(err, ErrInvalidCommand):
		response := errorResponse{status: http.StatusBadRequest, code: "bad_request", reason: "malformed_json"}
		if typeErr != nil && typeErr.Field != "" {
			response.reason, response.field = "invalid_field", typeErr.Field
		}
		return response
	case missing != nil:
		return errorResponse{status: http.StatusNotFound, code: "table_not_found", reason: "materialization_missing", reference: &missing.Reference}
	case errors.Is(err, errUnsupportedCommand), errors.Is(err, query.ErrExecWithValidation):
		return errorResponse{status: http.StatusBadRequest, code: "unsupported_command", reason: "command_disabled"}
	case errors.Is(err, query.ErrInvalidPolicy):
		return errorResponse{status: http.StatusInternalServerError, code: "internal_error", reason: "validation_failed"}
	case errors.Is(err, query.ErrAccessDenied):
		return errorResponse{status: http.StatusForbidden, code: "forbidden", reason: "policy_denied"}
	case errors.Is(err, query.ErrUnsupportedStatement):
		return errorResponse{status: http.StatusBadRequest, code: "bad_request", reason: "unsupported_statement"}
	case isDetails && (details.Code == "parser" || details.Code == "invalid_input"),
		isEngine && (engine.Type == duckdb.ErrorTypeParser || engine.Type == duckdb.ErrorTypeSyntax):
		return errorResponse{status: http.StatusBadRequest, code: "bad_request", reason: "sql_parse_error"}
	case isDetails, isEngine:
		return errorResponse{status: http.StatusInternalServerError, code: "internal_error", reason: "execution_failed"}
	default:
		return errorResponse{status: http.StatusInternalServerError, code: "internal_error", reason: "internal_failure"}
	}
}

// With preaggregation enabled the response is the protocol's JSON envelope;
// otherwise it stays the plain-text body earlier deployments expect.
func (s *handler) writeError(w http.ResponseWriter, r *http.Request, err error) {
	response := classifyError(err)
	if !errors.Is(err, context.Canceled) && !errors.Is(err, context.DeadlineExceeded) {
		level := slog.LevelWarn
		if response.status >= http.StatusInternalServerError {
			level = slog.LevelError
		}
		s.logger.Log(r.Context(), level, "server: request failed", "status", response.status, "error", err)
	}
	if s.preaggregator == nil {
		http.Error(w, err.Error(), response.status)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(response.status)
	if err := json.NewEncoder(w).Encode(response.envelope(err)); err != nil {
		s.logger.Error("server: failed to write error response", "error", err)
	}
}
