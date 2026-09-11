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

func (r errorResponse) envelope() map[string]string {
	result := map[string]string{"error": r.message, "code": r.code}
	if r.table != nil {
		result["catalog"] = r.table.Catalog
		result["schema"] = r.table.Schema
		result["table"] = r.table.Table
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
	case errors.Is(err, query.ErrPreAggregateLimit):
		response.status = http.StatusTooManyRequests
		response.code = "resource_exhausted"
	case errors.Is(err, errUnsupportedCommand):
		response.status = http.StatusBadRequest
		response.code = "unsupported_command"
	case errors.Is(err, query.ErrExecWithValidation),
		errors.Is(err, query.ErrUnsupportedStatement),
		errors.As(err, &errorDetails),
		errors.As(err, &paramsError):
		response.status = http.StatusBadRequest
		response.code = "bad_request"
	case errors.Is(err, query.ErrAccessDenied):
		response.status = http.StatusForbidden
		response.code = "forbidden"
	}

	return response
}

func (s *handler) classifyAndLogError(err error) errorResponse {
	response := classifyError(err)
	if s.preaggregator != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			response.status = http.StatusGatewayTimeout
			response.code = "deadline_exceeded"
		}
		response.message = http.StatusText(response.status)
		if response.status == http.StatusInternalServerError {
			s.logger.Error("server: command failed", "error", err)
		}
		return response
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
