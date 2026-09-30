package server

import (
	"context"
	"errors"
	"net/http"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

type authorizationError struct {
	err error
}

func (e *authorizationError) Error() string {
	return e.err.Error()
}

func (e *authorizationError) Unwrap() error {
	return e.err
}

func classifyError(err error) (int, string) {
	var sizeErr *http.MaxBytesError
	if errors.As(err, &sizeErr) {
		return http.StatusRequestEntityTooLarge, http.StatusText(http.StatusRequestEntityTooLarge)
	}

	var authErr *authorizationError
	if errors.As(err, &authErr) {
		switch {
		case errors.Is(authErr, ErrInvalidCommand):
			return http.StatusBadRequest, http.StatusText(http.StatusBadRequest)
		case errors.Is(authErr, ErrUnauthenticated):
			return http.StatusUnauthorized, http.StatusText(http.StatusUnauthorized)
		case errors.Is(authErr, ErrPermissionDenied):
			return http.StatusForbidden, http.StatusText(http.StatusForbidden)
		default:
			return http.StatusInternalServerError, "authorization failed"
		}
	}

	status, message := http.StatusInternalServerError, err.Error()

	var (
		errorDetails query.ErrorDetails
		paramsError  queryParamsError
	)
	switch {
	case errors.Is(err, query.ErrInvalidPolicy):
		message = http.StatusText(http.StatusInternalServerError)
	case errors.Is(err, query.ErrAccessDenied):
		status = http.StatusForbidden
	case errors.Is(err, query.ErrExecWithValidation),
		errors.Is(err, query.ErrUnsupportedStatement),
		errors.As(err, &errorDetails),
		errors.As(err, &paramsError):
		status = http.StatusBadRequest
	}

	if errors.Is(err, query.ErrValidation) {
		message = http.StatusText(status)
	}
	return status, message
}

func (s *handler) writeError(w http.ResponseWriter, err error) {
	status, message := classifyError(err)
	var sizeErr *http.MaxBytesError
	switch {
	case errors.As(err, &sizeErr):
		s.logger.Warn("server: request body exceeds limit", "limit", sizeErr.Limit)
	case errors.Is(err, query.ErrValidation):
		if status == http.StatusInternalServerError {
			s.logger.Error("server: query validator failed", "error", err)
		} else {
			s.logger.Warn("server: query validation failed", "error", err)
		}
	}

	var authErr *authorizationError
	if status == http.StatusInternalServerError && errors.As(err, &authErr) &&
		!errors.Is(authErr, context.Canceled) && !errors.Is(authErr, context.DeadlineExceeded) {
		s.logger.Error("server: authorization failed", "error", authErr.err)
	}

	http.Error(w, message, status)
}
