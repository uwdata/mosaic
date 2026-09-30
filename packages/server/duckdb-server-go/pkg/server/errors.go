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

func errorStatus(err error) int {
	if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
		return http.StatusRequestEntityTooLarge
	}

	if authErr, ok := errors.AsType[*authorizationError](err); ok {
		switch {
		case errors.Is(authErr, ErrInvalidCommand):
			return http.StatusBadRequest
		case errors.Is(authErr, ErrUnauthenticated):
			return http.StatusUnauthorized
		case errors.Is(authErr, ErrPermissionDenied):
			return http.StatusForbidden
		default:
			return http.StatusInternalServerError
		}
	}

	_, isDetails := errors.AsType[query.ErrorDetails](err)
	_, isParams := errors.AsType[queryParamsError](err)
	switch {
	case errors.Is(err, query.ErrInvalidPolicy):
		return http.StatusInternalServerError
	case errors.Is(err, query.ErrAccessDenied):
		return http.StatusForbidden
	case errors.Is(err, query.ErrExecWithValidation),
		errors.Is(err, query.ErrUnsupportedStatement),
		errors.Is(err, ErrInvalidCommand),
		isDetails, isParams:
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}

func (s *handler) writeError(w http.ResponseWriter, err error) {
	status := errorStatus(err)
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

	http.Error(w, err.Error(), status)
}
