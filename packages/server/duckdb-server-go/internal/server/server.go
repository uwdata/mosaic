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

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/internal/query"
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

type Server struct {
	*http.ServeMux

	db *query.DB

	logger *slog.Logger
}

func New(db *query.DB, logger *slog.Logger) *Server {
	mux := http.NewServeMux()

	if logger == nil {
		logger = slog.Default()
	}

	s := &Server{
		ServeMux: mux,
		db:       db,
		logger:   logger,
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
		err = s.handleWebSocketMessage(r.Context(), conn)
		if err != nil {
			s.logger.Error("server: websocket error, breaking connection", "error", err)
			break
		}
	}
}

// only return an error if you want to close the connection, which we do on any write errors, but not on command errors
func (s *Server) handleWebSocketMessage(ctx context.Context, conn *websocket.Conn) error {
	var params QueryParams
	err := wsjson.Read(ctx, conn, &params)
	if err != nil {
		return fmt.Errorf("failed to read websocket message: %w", err)
	}

	data, _, err := s.execCommand(context.TODO(), params)
	if err != nil {
		writeErr := wsjson.Write(ctx, conn, map[string]string{"error": err.Error()})
		if writeErr != nil {
			return fmt.Errorf("server: failed to write error response: %w", writeErr)
		}

		return nil
	}

	switch *params.Type {
	case CommandExec:
		err = conn.Write(ctx, websocket.MessageText, []byte("{}"))
		if err != nil {
			return fmt.Errorf("server: failed to write exec response: %w", err)
		}

	case CommandArrow:
		err = conn.Write(ctx, websocket.MessageBinary, data)
		if err != nil {
			return fmt.Errorf("server: failed to write arrow response: %w", err)
		}

	case CommandJSON:
		err = conn.Write(ctx, websocket.MessageText, data)
		if err != nil {
			return fmt.Errorf("server: failed to write json response: %w", err)
		}

	default:
		// should have been caught by validation
		panic("server: unknown command type:" + *params.Type)
	}

	return nil
}

func (s *Server) handleHTTP(w http.ResponseWriter, r *http.Request) {
	var params QueryParams

	// we support both POST and GET methods for the same endpoint

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

	data, cacheHit, err := s.execCommand(r.Context(), params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	switch *params.Type {
	case CommandExec:
		w.WriteHeader(http.StatusOK)

	case CommandArrow:
		w.Header().Set("Content-Type", "application/vnd.apache.arrow.stream")
		if cacheHit {
			w.Header().Set("Cache-Status", "mosaic-duckdb-go; hit")
		}

		_, err = w.Write(data)
		if err != nil {
			s.logger.Error("server: failed to write Arrow data", "error", err)
			return
		}

		return

	case CommandJSON:
		w.Header().Set("Content-Type", "application/json")
		if cacheHit {
			w.Header().Set("Cache-Status", "mosaic-duckdb-go; hit")
		}

		_, err = w.Write(data)
		if err != nil {
			s.logger.Error("server: failed to write JSON data", "error", err)
			return
		}

		return

	default:
		// should have been caught by validation
		panic("server: unknown command type:" + *params.Type)
	}
}

func (s *Server) execCommand(ctx context.Context, params QueryParams) ([]byte, bool, error) {
	err := params.Validate(s.logger)
	if err != nil {
		return nil, false, err
	}

	// useCache is true by default, unless explicitly set to false
	useCache := true
	if params.Persist != nil {
		useCache = *params.Persist
	}

	switch *params.Type {
	case CommandExec:
		return nil, false, s.db.Exec(ctx, *params.SQL) // No data to return for exec command

	case CommandArrow:
		return s.db.QueryArrow(ctx, *params.SQL, useCache)

	case CommandJSON:
		return s.db.QueryJSON(ctx, *params.SQL, useCache)

	default:
		// should have been caught by validation
		panic("server: unknown command type:" + *params.Type)
	}
}

func (p QueryParams) Validate(logger *slog.Logger) error {
	if p.Type == nil || *p.Type == "" {
		logger.Error("server: missing required 'type' parameter")
		return errors.New("missing required 'type' parameter")
	}

	switch *p.Type {
	case CommandArrow, CommandExec, CommandJSON:
	default:
		logger.Error("server: invalid 'type' parameter", "type", *p.Type)
		return errors.New("invalid 'type' parameter: " + string(*p.Type))
	}

	if p.SQL == nil || *p.SQL == "" {
		logger.Error("server: missing required 'sql' parameter")
		return errors.New("missing required 'sql' parameter")
	}

	return nil
}
