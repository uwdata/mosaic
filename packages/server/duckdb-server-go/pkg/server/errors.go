package server

import (
	"context"
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
	message string
	table   *query.MissingPreAggregateError
}

func (r errorResponse) envelope() map[string]any {
	result := map[string]any{"error": r.message, "code": r.code}
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
			return errorResponse{http.StatusBadRequest, "bad_request", http.StatusText(http.StatusBadRequest), nil}
		case errors.Is(authErr, ErrUnauthenticated):
			return errorResponse{http.StatusUnauthorized, "unauthenticated", http.StatusText(http.StatusUnauthorized), nil}
		case errors.Is(authErr, ErrPermissionDenied):
			return errorResponse{http.StatusForbidden, "forbidden", http.StatusText(http.StatusForbidden), nil}
		default:
			return errorResponse{http.StatusInternalServerError, "internal_error", "authorization failed", nil}
		}
	}

	response := errorResponse{
		status:  http.StatusInternalServerError,
		code:    "internal_error",
		message: err.Error(),
	}

	var (
		errorDetails query.ErrorDetails
		paramsError  queryParamsError
		missing      *query.MissingPreAggregateError
	)
	switch {
	case errors.As(err, &missing):
		response.status = http.StatusNotFound
		response.code = "table_not_found"
		response.table = missing
	case errors.Is(err, errUnsupportedCommand):
		response.status = http.StatusBadRequest
		response.code = "unsupported_command"
	case errors.Is(err, query.ErrInvalidPolicy):
		response.message = http.StatusText(http.StatusInternalServerError)
	case errors.Is(err, query.ErrAccessDenied):
		response.status = http.StatusForbidden
		response.code = "forbidden"
	case errors.Is(err, query.ErrExecWithValidation),
		errors.Is(err, query.ErrUnsupportedStatement),
		errors.As(err, &errorDetails),
		errors.As(err, &paramsError):
		response.status = http.StatusBadRequest
		response.code = "bad_request"
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
