package server

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/klauspost/compress/gzhttp"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

type queryParams struct {
	Type *CommandType `json:"type"`
	SQL  *string      `json:"sql"`
	raw  []byte
}

const arrowContentType = "application/vnd.apache.arrow.stream"

// commandExecutor is private so the server package does not expose query's
// current schema-policy plumbing as a supported extension point.
type commandExecutor interface {
	Exec(context.Context, string) error
	Query(context.Context, string, *query.ValidationPolicy) ([]byte, error)
}

type handler struct {
	db           commandExecutor
	logger       *slog.Logger
	authorizer   commandAuthorizer
	httpHandler  http.Handler
	cacheControl string
	varyHeaders  []string
}

// New constructs a Mosaic HTTP handler backed by db. Omitting
// WithAuthorizer preserves unrestricted command behavior.
func New(db *query.DB, opts ...Option) (http.Handler, error) {
	if db == nil {
		return nil, errors.New("server: database is required")
	}

	cfg, err := applyOptions(opts)
	if err != nil {
		return nil, err
	}

	return newHandler(db, cfg), nil
}

func newHandler(db commandExecutor, cfg config) *handler {
	s := &handler{
		db:           db,
		logger:       cfg.logger,
		authorizer:   cfg.authorizer,
		cacheControl: cfg.cacheControl,
		varyHeaders:  cfg.varyHeaders,
	}

	s.httpHandler = newCORSHandler(cfg.cors, cfg.corsProtection, gzhttp.GzipHandler(http.HandlerFunc(s.handleHTTP)))
	if cfg.maxBytes > 0 {
		s.httpHandler = http.MaxBytesHandler(s.httpHandler, cfg.maxBytes)
	}

	return s
}

func (s *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if s.cacheControl != "" {
		w.Header().Set("Cache-Control", "no-store")
	}
	if len(s.varyHeaders) > 0 {
		w.Header().Add("Vary", strings.Join(s.varyHeaders, ", "))
	}

	s.httpHandler.ServeHTTP(w, r)
}

func (s *handler) handleHTTP(w http.ResponseWriter, r *http.Request) {
	var params queryParams

	switch r.Method {
	case http.MethodPost:
		raw, err := io.ReadAll(r.Body)
		if err == nil {
			err = json.Unmarshal(raw, &params)
		}
		if err != nil {
			s.writeError(w, r, fmt.Errorf("%w: decode request body: %w", ErrInvalidCommand, err))
			return
		}
		params.raw = raw

	case http.MethodGet:
		q := r.URL.Query()
		params.Type = new(CommandType(q.Get("type")))
		params.SQL = new(q.Get("sql"))

	default:
		s.writeError(w, r, fmt.Errorf("%w: %s", errMethodNotAllowed, r.Method))
		return
	}

	data, err := s.execCommand(r, params)
	if err != nil {
		s.writeError(w, r, err)
		return
	}

	if *params.Type == CommandExec {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method == http.MethodGet && s.cacheControl != "" {
		etag := responseETag(data, responseEncoding(r, data))
		if value := strings.Join(r.Header.Values("If-Match"), ","); value != "" && !matchesETag(value, etag, false) {
			http.Error(w, http.StatusText(http.StatusPreconditionFailed), http.StatusPreconditionFailed)
			return
		}
		w.Header().Set("ETag", etag)
		w.Header().Set("Cache-Control", s.cacheControl)
		if matchesETag(strings.Join(r.Header.Values("If-None-Match"), ","), etag, true) {
			w.WriteHeader(http.StatusNotModified)
			return
		}
	}

	w.Header().Set("Content-Type", arrowContentType)
	if _, err = w.Write(data); err != nil {
		s.logger.Error("server: failed to write response", "error", err)
	}
}

func (s *handler) execCommand(r *http.Request, params queryParams) ([]byte, error) {
	if err := params.Validate(); err != nil {
		return nil, err
	}
	ctx := r.Context()
	var err error
	var policy *query.ValidationPolicy

	if s.authorizer != nil {
		if policy, err = s.authorizer(r, params); err != nil {
			return nil, err
		}
	}

	switch *params.Type {
	case CommandExec:
		if policy != nil {
			return nil, query.ErrExecWithValidation
		}
		return nil, s.db.Exec(ctx, *params.SQL)

	case CommandArrow:
		return s.db.Query(ctx, *params.SQL, policy)

	default:
		return nil, fmt.Errorf("server: no executor for command type %q", *params.Type)
	}
}

func (p queryParams) Validate() error {
	if p.Type == nil || *p.Type == "" {
		return fmt.Errorf("%w: missing required 'type' parameter", ErrInvalidCommand)
	}

	if *p.Type != CommandArrow && *p.Type != CommandExec {
		return fmt.Errorf("%w: invalid 'type' parameter: %s", ErrInvalidCommand, *p.Type)
	}

	if p.SQL == nil || *p.SQL == "" {
		return fmt.Errorf("%w: missing required 'sql' parameter", ErrInvalidCommand)
	}

	return nil
}
