package server

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

type CommandType string

const (
	CommandArrow CommandType = "arrow"
	CommandExec  CommandType = "exec"
	CommandJSON  CommandType = "json"
)

type queryParams struct {
	Type    *CommandType `json:"type"`
	SQL     *string      `json:"sql"`
	Persist *bool        `json:"persist"`
	Name    *string      `json:"name"`
}

type commandResponse struct {
	data        []byte
	cacheHit    bool
	contentType string
	wsMessage   websocket.MessageType
}

var commandResponses = map[CommandType]commandResponse{
	CommandExec:  {wsMessage: websocket.MessageText},
	CommandArrow: {contentType: "application/vnd.apache.arrow.stream", wsMessage: websocket.MessageBinary},
	CommandJSON:  {contentType: "application/json", wsMessage: websocket.MessageText},
}

type queryParamsError string

func (e queryParamsError) Error() string {
	return string(e)
}

type handler struct {
	db                 *query.DB
	schemaMatchHeaders []string
	logger             *slog.Logger
	httpHandler        http.Handler
}

// New constructs a Mosaic HTTP and WebSocket handler backed by db.
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

func newHandler(db *query.DB, cfg config) *handler {
	s := &handler{
		db:                 db,
		schemaMatchHeaders: cfg.schemaMatchHeaders,
		logger:             cfg.logger,
	}

	s.httpHandler = corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.ToLower(r.Header.Get("Connection")) == "upgrade" &&
			strings.ToLower(r.Header.Get("Upgrade")) == "websocket" {
			s.handleWebSocket(w, r)
		} else {
			s.handleHTTP(w, r)
		}
	}))

	return s
}

func (s *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.httpHandler.ServeHTTP(w, r)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Request-Method", "*")
		w.Header().Set("Access-Control-Allow-Methods", "OPTIONS, POST, GET")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		w.Header().Set("Access-Control-Max-Age", "2592000")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *handler) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	allowedSchemas := getAllowedSchemas(r, s.schemaMatchHeaders)
	if len(s.schemaMatchHeaders) > 0 && len(allowedSchemas) == 0 {
		s.logger.Error("server: no allowed schemas found in request headers", "headers", s.schemaMatchHeaders)
		http.Error(w, "no allowed schemas found in request headers", http.StatusUnauthorized)
		return
	}

	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
		CompressionMode:    websocket.CompressionContextTakeover,
	})
	if err != nil {
		s.logger.Error("server: failed to accept websocket connection", "error", err)
		return
	}

	defer func() {
		err = conn.Close(websocket.StatusInternalError, "connection closed")
		if err != nil {
			s.logger.Error("server: error closing websocket", "error", err)
		}
	}()

	for {
		err = s.handleWebSocketMessage(r.Context(), conn, allowedSchemas)
		if err != nil {
			s.logger.Error("server: websocket error, breaking connection", "error", err)
			break
		}
	}
}

// A returned error closes the connection. Command errors are written to the
// client and return nil so the session survives them.
func (s *handler) handleWebSocketMessage(ctx context.Context, conn *websocket.Conn, allowedSchemas []string) error {
	var params queryParams
	err := wsjson.Read(ctx, conn, &params)
	if err != nil {
		return fmt.Errorf("failed to read websocket message: %w", err)
	}

	response, err := s.execCommand(context.TODO(), params, allowedSchemas)
	if err != nil {
		writeErr := wsjson.Write(ctx, conn, map[string]string{"error": err.Error()})
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
	allowedSchemas := getAllowedSchemas(r, s.schemaMatchHeaders)
	if len(s.schemaMatchHeaders) > 0 && len(allowedSchemas) == 0 {
		s.logger.Error("server: no allowed schemas found in request headers", "headers", s.schemaMatchHeaders)
		http.Error(w, "no allowed schemas found in request headers", http.StatusUnauthorized)
		return
	}

	var params queryParams

	switch r.Method {
	case http.MethodPost:
		err := json.NewDecoder(r.Body).Decode(&params)
		if err != nil {
			s.logger.Error("server: failed to decode request body", "error", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

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

	response, err := s.execCommand(r.Context(), params, allowedSchemas)
	if err != nil {
		status := http.StatusInternalServerError
		var (
			errorDetails query.ErrorDetails
			paramsError  queryParamsError
		)
		switch {
		case errors.Is(err, query.ErrExecWithValidation),
			errors.Is(err, query.ErrUnsupportedStatement),
			errors.As(err, &errorDetails),
			errors.As(err, &paramsError):
			status = http.StatusBadRequest
		case errors.Is(err, query.ErrAccessDenied):
			status = http.StatusForbidden
		}
		http.Error(w, err.Error(), status)
		return
	}

	if response.contentType == "" {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", response.contentType)
	if response.cacheHit {
		w.Header().Set("Cache-Status", "mosaic-duckdb-go; hit")
	}
	if _, err = w.Write(response.data); err != nil {
		s.logger.Error("server: failed to write response", "error", err, "content_type", response.contentType)
	}
}

func (s *handler) execCommand(ctx context.Context, params queryParams, allowedSchemas []string) (commandResponse, error) {
	if err := params.Validate(s.logger); err != nil {
		return commandResponse{}, err
	}
	response := commandResponses[*params.Type]
	var err error

	useCache := false
	if params.Persist != nil {
		useCache = *params.Persist
	}

	switch *params.Type {
	case CommandExec:
		if len(s.schemaMatchHeaders) > 0 {
			return commandResponse{}, query.ErrExecWithValidation
		}
		err = s.db.Exec(ctx, *params.SQL)

	case CommandArrow:
		response.data, response.cacheHit, err = s.db.QueryArrow(ctx, *params.SQL, allowedSchemas, useCache)

	case CommandJSON:
		response.data, response.cacheHit, err = s.db.QueryJSON(ctx, *params.SQL, allowedSchemas, useCache)

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
