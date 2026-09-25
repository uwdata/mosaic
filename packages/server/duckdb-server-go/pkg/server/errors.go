package server

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

var errNoCommandAuthorizer = errors.New("server: authorizer returned no command authorizer")

type authorizationError struct {
	err error
}

func (e *authorizationError) Error() string {
	return e.err.Error()
}

func (e *authorizationError) Unwrap() error {
	return e.err
}

type errorResponse struct {
	status  int
	code    string
	reason  string
	field   string
	message string
	table   *query.MissingPreAggregateError
}

func (r errorResponse) envelope() map[string]any {
	result := map[string]any{"error": r.message, "code": r.code, "reason": r.reason}
	if r.field != "" {
		result["field"] = r.field
	}
	if r.table != nil {
		result["reference"] = r.table.Reference
	}
	return result
}

func classifyError(err error) errorResponse {
	var authErr *authorizationError
	if errors.As(err, &authErr) {
		switch {
		case errors.Is(authErr, ErrInvalidCommand):
			response := errorResponse{status: http.StatusBadRequest, code: "bad_request", reason: "malformed_json", message: http.StatusText(http.StatusBadRequest)}
			var typeErr *json.UnmarshalTypeError
			if errors.As(authErr, &typeErr) && typeErr.Field != "" {
				response.reason, response.field = "invalid_field", typeErr.Field
			}
			return response
		case errors.Is(authErr, ErrUnauthenticated):
			return errorResponse{status: http.StatusUnauthorized, code: "unauthenticated", reason: "authentication_required", message: http.StatusText(http.StatusUnauthorized)}
		case errors.Is(authErr, ErrPermissionDenied):
			return errorResponse{status: http.StatusForbidden, code: "forbidden", reason: "access_denied", message: http.StatusText(http.StatusForbidden)}
		default:
			return errorResponse{status: http.StatusInternalServerError, code: "internal_error", reason: "internal_failure", message: "authorization failed"}
		}
	}

	response := errorResponse{
		status:  http.StatusInternalServerError,
		code:    "internal_error",
		reason:  "internal_failure",
		message: err.Error(),
	}

	var (
		errorDetails query.ErrorDetails
		paramsError  *queryParamsError
		missing      *query.MissingPreAggregateError
	)
	switch {
	case errors.As(err, &missing):
		response.status, response.code, response.reason = http.StatusNotFound, "table_not_found", "materialization_missing"
		response.table = missing
	case errors.Is(err, errUnsupportedCommand), errors.Is(err, query.ErrExecWithValidation):
		response.status, response.code, response.reason = http.StatusBadRequest, "unsupported_command", "command_disabled"
	case errors.Is(err, query.ErrInvalidPolicy):
		response.reason = "validation_failed"
		response.message = http.StatusText(http.StatusInternalServerError)
	case errors.Is(err, query.ErrAccessDenied):
		response.status, response.code, response.reason = http.StatusForbidden, "forbidden", "policy_denied"
	case errors.Is(err, query.ErrUnsupportedStatement):
		response.status, response.code, response.reason = http.StatusBadRequest, "bad_request", "unsupported_statement"
	case errors.As(err, &errorDetails):
		response.status, response.code = http.StatusBadRequest, "bad_request"
		switch errorDetails.Code {
		case "parser", "invalid_input":
			response.reason = "sql_parse_error"
		default:
			// Binding failures on user tables stay 400 (D7 leaves this open); the sql property is what is unusable.
			response.reason, response.field = "invalid_field", "sql"
		}
	case errors.As(err, &paramsError):
		response.status, response.code = http.StatusBadRequest, "bad_request"
		response.reason, response.field = paramsError.reason, paramsError.field
	}

	if errors.Is(err, query.ErrValidation) {
		response.message = http.StatusText(response.status)
	}
	return response
}

func (s *handler) classifyAndLogError(err error) errorResponse {
	response := classifyError(err)
	if errors.Is(err, query.ErrValidation) {
		if response.status == http.StatusInternalServerError {
			s.logger.Error("server: query validator failed", "error", err)
		} else {
			s.logger.Warn("server: query validation failed", "error", err)
		}
	}
	if response.status != http.StatusInternalServerError {
		return response
	}

	var authErr *authorizationError
	if errors.As(err, &authErr) {
		if errors.Is(authErr, context.Canceled) || errors.Is(authErr, context.DeadlineExceeded) {
			return response
		}
		s.logger.Error("server: authorization failed", "error", authErr.err)
	}

	return response
}
