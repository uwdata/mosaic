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

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"

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
	wsMessage   websocket.MessageType
}

var commandResponses = map[CommandType]commandResponse{
	CommandExec:   {wsMessage: websocket.MessageText},
	CommandArrow:  {contentType: "application/vnd.apache.arrow.stream", wsMessage: websocket.MessageBinary},
	CommandPreagg: {contentType: "application/json", wsMessage: websocket.MessageText},
}

type queryParamsError string

func (e queryParamsError) Error() string {
	return string(e)
}

// commandExecutor is private so the server package does not expose query's
// current schema-policy plumbing as a supported extension point.
type commandExecutor interface {
	Exec(context.Context, string) error
	QueryArrow(context.Context, string, []string) ([]byte, error)
}

type handler struct {
	db                 commandExecutor
	schemaMatchHeaders []string
	logger             *slog.Logger
	authorizer         requestAuthorizer
	httpHandler        http.Handler
	websocketOptions   WebSocketOptions
	maxMessageBytes    int64
	cacheControl       string
	varyHeaders        []string
	preaggregator      *query.PreAggregator
	preaggregateScope  func(context.Context) (query.PreAggregateScope, error)
}

// New constructs a Mosaic HTTP and WebSocket handler backed by db. Omitting
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
		if len(cfg.schemaMatchHeaders) > 0 {
			return nil, errors.New("server: preaggregation scope resolver cannot be combined with schema-match headers")
		}
		options := cfg.preaggregate
		p, err := query.NewPreAggregator(context.Background(), db, options.Catalog, options.Limits)
		if err != nil {
			return nil, err
		}
		s.preaggregator = p
		s.preaggregateScope = options.Scope
	}
	return s, nil
}

func newHandler(db commandExecutor, cfg config) *handler {
	s := &handler{
		db:                 db,
		schemaMatchHeaders: cfg.schemaMatchHeaders,
		logger:             cfg.logger,
		authorizer:         cfg.authorizer,
		websocketOptions:   cfg.websocket,
		maxMessageBytes:    cfg.maxMessageBytes,
		cacheControl:       cfg.cacheControl,
		varyHeaders:        cfg.varyHeaders,
	}

	s.httpHandler = newCORSHandler(cfg.cors, cfg.corsProtection, http.HandlerFunc(s.handleHTTP))

	return s
}

func (s *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if s.cacheControl != "" {
		w.Header().Set("Cache-Control", "no-store")
	}
	if len(s.varyHeaders) > 0 {
		w.Header().Add("Vary", strings.Join(s.varyHeaders, ", "))
	}

	if strings.EqualFold(r.Header.Get("Connection"), "upgrade") &&
		strings.EqualFold(r.Header.Get("Upgrade"), "websocket") {
		s.handleWebSocket(w, r)
		return
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
	if s.preaggregator != nil {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		w.WriteHeader(response.status)
		if err := json.NewEncoder(w).Encode(response.envelope()); err != nil {
			s.logger.Error("server: failed to write error response", "error", err)
		}
		return
	}
	http.Error(w, response.message, response.status)
}

func (s *handler) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	if !webSocketOriginAllowed(r, s.websocketOptions) {
		http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		return
	}

	allowedSchemas := getAllowedSchemas(r, s.schemaMatchHeaders)
	if len(s.schemaMatchHeaders) > 0 && len(allowedSchemas) == 0 {
		s.logger.Error("server: no allowed schemas found in request headers", "headers", s.schemaMatchHeaders)
		http.Error(w, "no allowed schemas found in request headers", http.StatusUnauthorized)
		return
	}

	authorize, err := s.commandAuthorizer(r)
	if err != nil {
		s.writeHTTPError(w, err)
		return
	}

	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		InsecureSkipVerify: s.websocketOptions.AllowAllOrigins,
		OriginPatterns:     s.websocketOptions.AllowedOrigins,
		CompressionMode:    websocket.CompressionContextTakeover,
	})
	if err != nil {
		s.logger.Error("server: failed to accept websocket connection", "error", err)
		return
	}

	if s.maxMessageBytes > 0 {
		conn.SetReadLimit(s.maxMessageBytes)
	}

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	defer func() {
		err = conn.Close(websocket.StatusInternalError, "connection closed")
		if err != nil {
			s.logger.Error("server: error closing websocket", "error", err)
		}
	}()

	for {
		err = s.handleWebSocketMessage(ctx, conn, allowedSchemas, authorize)
		if err != nil {
			s.logger.Error("server: websocket error, breaking connection", "error", err)
			break
		}
	}
}

// A returned error closes the connection. Command errors are written to the
// client and return nil so the session survives them.
func (s *handler) handleWebSocketMessage(ctx context.Context, conn *websocket.Conn, allowedSchemas []string, authorize commandAuthorizer) error {
	_, raw, err := conn.Read(ctx)
	if err != nil {
		return fmt.Errorf("failed to read websocket message: %w", err)
	}

	var params queryParams
	if err = json.Unmarshal(raw, &params); err != nil {
		return errors.Join(
			fmt.Errorf("failed to decode websocket message: %w", err),
			conn.Close(websocket.StatusInvalidFramePayloadData, "failed to unmarshal JSON"),
		)
	}
	params.raw = raw

	var response commandResponse
	if params.Type != nil && *params.Type == CommandPreagg {
		err = errUnsupportedCommand
	} else {
		response, err = s.execCommand(ctx, params, allowedSchemas, authorize)
	}
	if err != nil {
		errResponse := s.classifyAndLogError(err)
		writeErr := wsjson.Write(ctx, conn, errResponse.envelope())
		if writeErr != nil {
			return fmt.Errorf("server: failed to write error response: %w", writeErr)
		}

		return nil
	}

	payload := response.data
	if response.contentType == "" {
		payload = []byte("{}")
	}
	if err = conn.Write(ctx, response.wsMessage, payload); err != nil {
		return fmt.Errorf("server: failed to write response: %w", err)
	}

	return nil
}

func (s *handler) handleHTTP(w http.ResponseWriter, r *http.Request) {
	if s.preaggregator != nil {
		w.Header().Set("Cache-Control", "no-store")
	}
	allowedSchemas := getAllowedSchemas(r, s.schemaMatchHeaders)
	if len(s.schemaMatchHeaders) > 0 && len(allowedSchemas) == 0 {
		s.logger.Error("server: no allowed schemas found in request headers", "headers", s.schemaMatchHeaders)
		http.Error(w, "no allowed schemas found in request headers", http.StatusUnauthorized)
		return
	}

	authorize, err := s.commandAuthorizer(r)
	if err != nil {
		s.writeHTTPError(w, err)
		return
	}

	var params queryParams

	switch r.Method {
	case http.MethodPost:
		if s.maxMessageBytes > 0 {
			r.Body = http.MaxBytesReader(w, r.Body, s.maxMessageBytes)
		}
		raw, err := io.ReadAll(r.Body)
		if err == nil {
			err = json.Unmarshal(raw, &params)
		}
		if err != nil {
			var sizeErr *http.MaxBytesError
			if errors.As(err, &sizeErr) {
				s.logger.Warn("server: request body exceeds message limit", "limit", sizeErr.Limit)
				http.Error(w, http.StatusText(http.StatusRequestEntityTooLarge), http.StatusRequestEntityTooLarge)
				return
			}
			s.logger.Error("server: failed to decode request body", "error", err)
			s.writeHTTPError(w, queryParamsError(err.Error()))
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

	if r.Method == http.MethodGet && params.Type != nil && *params.Type == CommandPreagg {
		s.writeHTTPError(w, queryParamsError("preagg requires POST"))
		return
	}

	response, err := s.execCommand(r.Context(), params, allowedSchemas, authorize)
	if err != nil {
		s.writeHTTPError(w, err)
		return
	}

	if response.contentType == "" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method == http.MethodGet && s.cacheControl != "" {
		etag := responseETag(response)
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

func (s *handler) execCommand(ctx context.Context, params queryParams, allowedSchemas []string, authorize commandAuthorizer) (commandResponse, error) {
	if err := params.Validate(s.logger); err != nil {
		return commandResponse{}, err
	}
	response := commandResponses[*params.Type]
	var err error

	if authorize != nil {
		if err = authorize(ctx, params); err != nil {
			return commandResponse{}, &authorizationError{err: err}
		}
	}

	switch *params.Type {
	case CommandExec:
		if len(s.schemaMatchHeaders) > 0 || s.preaggregator != nil {
			return commandResponse{}, query.ErrExecWithValidation
		}
		err = s.db.Exec(ctx, *params.SQL)

	case CommandArrow:
		if s.preaggregator == nil {
			response.data, err = s.db.QueryArrow(ctx, *params.SQL, allowedSchemas)
		} else {
			response.data, err = s.queryPreaggregate(ctx, params, authorize)
		}

	case CommandPreagg:
		if s.preaggregator == nil {
			return commandResponse{}, errUnsupportedCommand
		}
		response.data, err = s.queryPreaggregate(ctx, params, authorize)

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

func getAllowedSchemas(req *http.Request, schemaMatchHeaders []string) []string {
	var allowedSchemas []string

	for _, matchHeader := range schemaMatchHeaders {
		allowedSchema := req.Header.Get(strings.TrimSpace(matchHeader))
		if allowedSchema != "" {
			allowedSchemas = append(allowedSchemas, allowedSchema)
		}
	}

	return allowedSchemas
}
