package server

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

var (
	ErrUnauthenticated  = errors.New("server: unauthenticated")
	ErrPermissionDenied = errors.New("server: permission denied")
	ErrInvalidCommand   = errors.New("server: invalid command")
)

type CommandType string

const (
	CommandArrow CommandType = "arrow"
	CommandExec  CommandType = "exec"
)

// Command exposes the authoritative type and SQL alongside an application-owned
// payload decoded from the complete command envelope.
type Command[T any] struct {
	typ     CommandType
	sql     string
	payload T
}

func (c Command[T]) Type() CommandType {
	return c.typ
}

func (c Command[T]) SQL() string {
	return c.sql
}

// Payload returns the application's decoded value, or the zero value of T for
// HTTP GET. It may contain mutable data; mutations cannot change Type or SQL.
func (c Command[T]) Payload() T {
	return c.payload
}

// Authorizer authorizes one command after the handler decodes it and checks its
// type and SQL, and before SQL policy validation and execution. It returns the
// validation policy applied on the connection that executes the command.
// Returning nil leaves the command unvalidated unless the DB was built with
// query.WithValidation. A non-nil error denies the command. The handler has
// already consumed POST bodies; use Command.Payload. It must be safe for
// concurrent use.
type Authorizer[T any] func(*http.Request, Command[T]) (*query.ValidationPolicy, error)

type commandAuthorizer func(*http.Request, queryParams) (*query.ValidationPolicy, error)

// WithAuthorizer decodes each complete JSON envelope into a fresh T before
// command authorization. Payload decoding failures reject the command with
// ErrInvalidCommand; HTTP GET skips decoding and uses the zero value of T.
func WithAuthorizer[T any](authorize Authorizer[T]) Option {
	return optionFunc(func(cfg *config) error {
		if authorize == nil {
			return errNilAuthorizer
		}

		cfg.authorizer = func(r *http.Request, params queryParams) (*query.ValidationPolicy, error) {
			var payload T
			if _, empty := any(&payload).(*struct{}); !empty && params.raw != nil {
				if err := json.Unmarshal(params.raw, &payload); err != nil {
					attrs := []any{"error_type", fmt.Sprintf("%T", err)}
					var typeErr *json.UnmarshalTypeError
					if errors.As(err, &typeErr) {
						attrs = append(attrs, "field", typeErr.Field, "offset", typeErr.Offset, "target_type", typeErr.Type.String())
					}
					cfg.logger.Warn("server: failed to decode command payload", attrs...)
					return nil, fmt.Errorf("%w: decode command payload: %w", ErrInvalidCommand, err)
				}
			}
			return authorize(r, Command[T]{typ: *params.Type, sql: *params.SQL, payload: payload})
		}
		return nil
	})
}
