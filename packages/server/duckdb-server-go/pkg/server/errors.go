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
	message string
}

func classifyError(err error) errorResponse {
	var sizeErr *http.MaxBytesError
	if errors.As(err, &sizeErr) {
		return errorResponse{http.StatusRequestEntityTooLarge, http.StatusText(http.StatusRequestEntityTooLarge)}
	}

	var authErr *authorizationError
	if errors.As(err, &authErr) {
		switch {
		case errors.Is(authErr, ErrInvalidCommand):
			return errorResponse{http.StatusBadRequest, http.StatusText(http.StatusBadRequest)}
		case errors.Is(authErr, ErrUnauthenticated):
			return errorResponse{http.StatusUnauthorized, http.StatusText(http.StatusUnauthorized)}
		case errors.Is(authErr, ErrPermissionDenied):
			return errorResponse{http.StatusForbidden, http.StatusText(http.StatusForbidden)}
		default:
			return errorResponse{http.StatusInternalServerError, "authorization failed"}
		}
	}

	response := errorResponse{
		status:  http.StatusInternalServerError,
		message: err.Error(),
	}

	var (
		errorDetails query.ErrorDetails
		paramsError  queryParamsError
	)
	switch {
	case errors.Is(err, query.ErrInvalidPolicy):
		response.message = http.StatusText(http.StatusInternalServerError)
	case errors.Is(err, query.ErrAccessDenied):
		response.status = http.StatusForbidden
	case errors.Is(err, query.ErrExecWithValidation),
		errors.Is(err, query.ErrUnsupportedStatement),
		errors.As(err, &errorDetails),
		errors.As(err, &paramsError):
		response.status = http.StatusBadRequest
	}

	if errors.Is(err, query.ErrValidation) {
		response.message = http.StatusText(response.status)
	}
	return response
}

func (s *handler) classifyAndLogError(err error) errorResponse {
	response := classifyError(err)
	var sizeErr *http.MaxBytesError
	if errors.As(err, &sizeErr) {
		s.logger.Warn("server: request body exceeds message limit", "limit", sizeErr.Limit)
		return response
	}
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
