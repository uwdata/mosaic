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

const (
	arrowContentType = "application/vnd.apache.arrow.stream"
	jsonContentType  = "application/json"
)

// commandExecutor is private so the server package does not expose query's
// current schema-policy plumbing as a supported extension point.
type commandExecutor interface {
	Exec(context.Context, string) error
	Query(context.Context, string, *query.ValidationPolicy) ([]byte, error)
}

type handler struct {
	db                    commandExecutor
	logger                *slog.Logger
	authorizer            commandAuthorizer
	httpHandler           http.Handler
	cacheControl          string
	varyHeaders           []string
	preaggregator         *query.PreAggregator
	preaggregateNamespace func(context.Context, queryParams) (query.Namespace, error)
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

	s := newHandler(db, cfg)
	if cfg.preaggregate != nil {
		p, err := query.NewPreAggregator(context.Background(), db, cfg.preaggregate.materializer)
		if err != nil {
			return nil, err
		}
		s.preaggregator = p
		s.preaggregateNamespace = cfg.preaggregate.namespace
	}
	return s, nil
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
	if s.cacheControl != "" || s.preaggregator != nil {
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
			s.writeError(w, r, malformedJSON(err))
			return
		}
		params.raw = raw

	case http.MethodGet:
		q := r.URL.Query()
		if q.Has("type") {
			params.Type = new(CommandType(q.Get("type")))
		}
		if q.Has("sql") {
			params.SQL = new(q.Get("sql"))
		}
		if params.Type != nil && *params.Type == CommandPreagg {
			s.writeError(w, r, invalidField("type", "preagg requires POST"))
			return
		}

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

	contentType := arrowContentType
	if *params.Type == CommandPreagg {
		contentType = jsonContentType
	}

	if r.Method == http.MethodGet && s.cacheControl != "" && s.preaggregator == nil {
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

	w.Header().Set("Content-Type", contentType)
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
		if s.preaggregator == nil {
			return s.db.Query(ctx, *params.SQL, policy)
		}
		return s.queryPreaggregate(r, params, policy)

	case CommandPreagg:
		if s.preaggregator == nil {
			return nil, errUnsupportedCommand
		}
		return s.queryPreaggregate(r, params, policy)

	default:
		return nil, fmt.Errorf("server: no executor for command type %q", *params.Type)
	}
}

func (p queryParams) Validate() error {
	if p.Type == nil || *p.Type == "" {
		return missingField("type")
	}

	if *p.Type != CommandArrow && *p.Type != CommandExec && *p.Type != CommandPreagg {
		return invalidField("type", "invalid 'type' parameter: "+string(*p.Type))
	}

	if p.SQL == nil {
		return missingField("sql")
	}
	if *p.SQL == "" {
		return invalidField("sql", "empty 'sql' parameter")
	}

	return nil
}
