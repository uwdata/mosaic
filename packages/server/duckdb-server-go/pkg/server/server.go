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
	Name *string      `json:"name"`
	raw  []byte
}

type commandResponse struct {
	data        []byte
	contentType string
}

var commandResponses = map[CommandType]commandResponse{
	CommandExec:  {},
	CommandArrow: {contentType: "application/vnd.apache.arrow.stream"},
}

type queryParamsError string

func (e queryParamsError) Error() string {
	return string(e)
}

// commandExecutor is private so the server package does not expose query's
// current schema-policy plumbing as a supported extension point.
type commandExecutor interface {
	Exec(context.Context, string) error
	Query(context.Context, string, *query.ValidationPolicy) ([]byte, error)
}

type handler struct {
	db              commandExecutor
	logger          *slog.Logger
	authorizer      requestAuthorizer
	httpHandler     http.Handler
	maxMessageBytes int64
	cacheControl    string
	varyHeaders     []string
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
		db:              db,
		logger:          cfg.logger,
		authorizer:      cfg.authorizer,
		maxMessageBytes: cfg.maxMessageBytes,
		cacheControl:    cfg.cacheControl,
		varyHeaders:     cfg.varyHeaders,
	}

	s.httpHandler = newCORSHandler(cfg.cors, cfg.corsProtection, gzhttp.GzipHandler(http.HandlerFunc(s.handleHTTP)))

	return s
}

func (s *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if s.maxMessageBytes > 0 {
		r.Body = http.MaxBytesReader(w, r.Body, s.maxMessageBytes)
	}
	if s.cacheControl != "" {
		w.Header().Set("Cache-Control", "no-store")
	}
	if len(s.varyHeaders) > 0 {
		w.Header().Add("Vary", strings.Join(s.varyHeaders, ", "))
	}

	s.httpHandler.ServeHTTP(w, r)
}

func (s *handler) commandAuthorizer(r *http.Request) (commandAuthorizer, error) {
	if s.authorizer == nil {
		return nil, nil
	}

	authorize, err := s.authorizer(r)
	if err != nil {
		return nil, &authorizationError{err: err}
	}
	if authorize == nil {
		return nil, &authorizationError{err: errNoCommandAuthorizer}
	}

	return authorize, nil
}

func (s *handler) writeHTTPError(w http.ResponseWriter, err error) {
	response := s.classifyAndLogError(err)
	http.Error(w, response.message, response.status)
}

func (s *handler) handleHTTP(w http.ResponseWriter, r *http.Request) {
	authorize, err := s.commandAuthorizer(r)
	if err != nil {
		s.writeHTTPError(w, err)
		return
	}

	var params queryParams

	switch r.Method {
	case http.MethodPost:
		raw, err := io.ReadAll(r.Body)
		if err == nil {
			err = json.Unmarshal(raw, &params)
		}
		if err != nil {
			var sizeErr *http.MaxBytesError
			if errors.As(err, &sizeErr) {
				s.writeHTTPError(w, err)
				return
			}
			s.logger.Error("server: failed to decode request body", "error", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		params.raw = raw

	case http.MethodGet:
		q := r.URL.Query()
		queryType := q.Get("type")
		sqlQuery := q.Get("sql")

		if queryType != "" {
			cmd := CommandType(queryType)
			params.Type = &cmd
		}

		if sqlQuery != "" {
			params.SQL = &sqlQuery
		}

	default:
		s.logger.Error("server: invalid method", "method", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	response, err := s.execCommand(r.Context(), params, authorize)
	if err != nil {
		s.writeHTTPError(w, err)
		return
	}

	if response.contentType == "" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method == http.MethodGet && s.cacheControl != "" {
		etag := responseETag(response, responseEncoding(r, response))
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

	w.Header().Set("Content-Type", response.contentType)
	if _, err = w.Write(response.data); err != nil {
		s.logger.Error("server: failed to write response", "error", err, "content_type", response.contentType)
	}
}

func (s *handler) execCommand(ctx context.Context, params queryParams, authorize commandAuthorizer) (commandResponse, error) {
	if err := params.Validate(s.logger); err != nil {
		return commandResponse{}, err
	}
	response := commandResponses[*params.Type]
	var err error
	var policy *query.ValidationPolicy

	if authorize != nil {
		if policy, err = authorize(ctx, params); err != nil {
			return commandResponse{}, &authorizationError{err: err}
		}
	}

	switch *params.Type {
	case CommandExec:
		if policy != nil {
			return commandResponse{}, query.ErrExecWithValidation
		}
		err = s.db.Exec(ctx, *params.SQL)

	case CommandArrow:
		response.data, err = s.db.Query(ctx, *params.SQL, policy)

	default:
		return commandResponse{}, fmt.Errorf("server: no executor for command type %q", *params.Type)
	}

	return response, err
}

func (p queryParams) Validate(logger *slog.Logger) error {
	if p.Type == nil || *p.Type == "" {
		logger.Error("server: missing required 'type' parameter")
		return queryParamsError("missing required 'type' parameter")
	}

	if _, ok := commandResponses[*p.Type]; !ok {
		logger.Error("server: invalid 'type' parameter", "type", *p.Type)
		return queryParamsError("invalid 'type' parameter: " + string(*p.Type))
	}

	if p.SQL == nil || *p.SQL == "" {
		logger.Error("server: missing required 'sql' parameter")
		return queryParamsError("missing required 'sql' parameter")
	}

	return nil
}
