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
	if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
		return http.StatusRequestEntityTooLarge, http.StatusText(http.StatusRequestEntityTooLarge)
	}

	if authErr, ok := errors.AsType[*authorizationError](err); ok {
		status := http.StatusInternalServerError
		switch {
		case errors.Is(authErr, ErrInvalidCommand):
			status = http.StatusBadRequest
		case errors.Is(authErr, ErrUnauthenticated):
			status = http.StatusUnauthorized
		case errors.Is(authErr, ErrPermissionDenied):
			status = http.StatusForbidden
		}
		return status, authErr.Error()
	}

	status, message := http.StatusInternalServerError, err.Error()

	_, isDetails := errors.AsType[query.ErrorDetails](err)
	_, isParams := errors.AsType[queryParamsError](err)
	switch {
	case errors.Is(err, query.ErrInvalidPolicy):
		message = http.StatusText(http.StatusInternalServerError)
	case errors.Is(err, query.ErrAccessDenied):
		status = http.StatusForbidden
	case errors.Is(err, query.ErrExecWithValidation),
		errors.Is(err, query.ErrUnsupportedStatement),
		errors.Is(err, ErrInvalidCommand),
		isDetails, isParams:
		status = http.StatusBadRequest
	}

	if errors.Is(err, query.ErrValidation) {
		message = http.StatusText(status)
	}
	return status, message
}

func (s *handler) writeError(w http.ResponseWriter, err error) {
	status, message := classifyError(err)
	if sizeErr, ok := errors.AsType[*http.MaxBytesError](err); ok {
		s.logger.Warn("server: request body exceeds limit", "limit", sizeErr.Limit)
	} else if errors.Is(err, query.ErrValidation) {
		if status == http.StatusInternalServerError {
			s.logger.Error("server: query validator failed", "error", err)
		} else {
			s.logger.Warn("server: query validation failed", "error", err)
		}
	}

	if authErr, ok := errors.AsType[*authorizationError](err); ok && status == http.StatusInternalServerError &&
		!errors.Is(authErr, context.Canceled) && !errors.Is(authErr, context.DeadlineExceeded) {
		s.logger.Error("server: authorization failed", "error", authErr.err)
	}

	http.Error(w, message, status)
}
