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

type Command string

const (
	CommandArrow Command = "arrow"
	CommandExec  Command = "exec"
	CommandJSON  Command = "json"
)

type QueryParams struct {
	Type    *Command `json:"type"`
	SQL     *string  `json:"sql"`
	Persist *bool    `json:"persist"`
	Name    *string  `json:"name"`
}

type commandResponse struct {
	data        []byte
	cacheHit    bool
	contentType string
	wsMessage   websocket.MessageType
}

var commandResponses = map[Command]commandResponse{
	CommandExec:  {wsMessage: websocket.MessageText},
	CommandArrow: {contentType: "application/vnd.apache.arrow.stream", wsMessage: websocket.MessageBinary},
	CommandJSON:  {contentType: "application/json", wsMessage: websocket.MessageText},
}

type queryParamsError string

func (e queryParamsError) Error() string {
	return string(e)
}

type Server struct {
	*http.ServeMux

	db                 *query.DB
	schemaMatchHeaders []string // list of headers to match against schema names for multi-tenant access control

	logger *slog.Logger
}

func New(db *query.DB, schemaMatchHeaders []string, logger *slog.Logger) *Server {
	mux := http.NewServeMux()

	if logger == nil {
		logger = slog.Default()
	}

	s := &Server{
		ServeMux:           mux,
		db:                 db,
		schemaMatchHeaders: schemaMatchHeaders,
		logger:             logger,
	}

	mux.Handle("/", corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.ToLower(r.Header.Get("Connection")) == "upgrade" &&
			strings.ToLower(r.Header.Get("Upgrade")) == "websocket" {
			s.handleWebSocket(w, r)
		} else {
			s.handleHTTP(w, r)
		}
	})))

	return s
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

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
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
func (s *Server) handleWebSocketMessage(ctx context.Context, conn *websocket.Conn, allowedSchemas []string) error {
	var params QueryParams
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

func (s *Server) handleHTTP(w http.ResponseWriter, r *http.Request) {
	allowedSchemas := getAllowedSchemas(r, s.schemaMatchHeaders)
	if len(s.schemaMatchHeaders) > 0 && len(allowedSchemas) == 0 {
		s.logger.Error("server: no allowed schemas found in request headers", "headers", s.schemaMatchHeaders)
		http.Error(w, "no allowed schemas found in request headers", http.StatusUnauthorized)
		return
	}

	var params QueryParams

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
			cmd := Command(queryType)
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

func (s *Server) execCommand(ctx context.Context, params QueryParams, allowedSchemas []string) (commandResponse, error) {
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

func (p QueryParams) Validate(logger *slog.Logger) error {
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
