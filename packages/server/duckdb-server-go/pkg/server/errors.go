package server

import (
	"context"
	"errors"
	"log/slog"
	"net/http"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

var errMethodNotAllowed = errors.New("server: method not allowed")

func errorStatus(err error) int {
	_, tooLarge := errors.AsType[*http.MaxBytesError](err)
	_, isDetails := errors.AsType[query.ErrorDetails](err)
	switch {
	case tooLarge:
		return http.StatusRequestEntityTooLarge
	case errors.Is(err, errMethodNotAllowed):
		return http.StatusMethodNotAllowed
	case errors.Is(err, ErrUnauthenticated):
		return http.StatusUnauthorized
	case errors.Is(err, ErrPermissionDenied):
		return http.StatusForbidden
	case errors.Is(err, ErrInvalidCommand):
		return http.StatusBadRequest
	case errors.Is(err, query.ErrInvalidPolicy):
		return http.StatusInternalServerError
	case errors.Is(err, query.ErrAccessDenied):
		return http.StatusForbidden
	case errors.Is(err, query.ErrExecWithValidation), errors.Is(err, query.ErrUnsupportedStatement), isDetails:
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}

func (s *handler) writeError(w http.ResponseWriter, r *http.Request, err error) {
	status := errorStatus(err)
	if !errors.Is(err, context.Canceled) && !errors.Is(err, context.DeadlineExceeded) {
		level := slog.LevelWarn
		if status >= http.StatusInternalServerError {
			level = slog.LevelError
		}
		s.logger.Log(r.Context(), level, "server: request failed", "status", status, "error", err)
	}
	http.Error(w, err.Error(), status)
}
