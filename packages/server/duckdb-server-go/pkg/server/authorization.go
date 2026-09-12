package server

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
)

var (
	ErrUnauthenticated  = errors.New("server: unauthenticated")
	ErrPermissionDenied = errors.New("server: permission denied")
	ErrInvalidCommand   = errors.New("server: invalid command")

	errNilAuthorizerFunc = errors.New("server: nil AuthorizerFunc")
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

// CommandAuthorizer authorizes one decoded and validated command from a request.
// Returning a non-nil error denies the command. Unexpected errors are sanitized
// as internal authorization failures.
type CommandAuthorizer[T any] func(context.Context, Command[T]) error

// Authorizer creates the command authorizer used for a single HTTP request or
// WebSocket session. AuthorizeRequest is called before a POST body is decoded
// or a WebSocket is upgraded. It should normally inspect the request line,
// headers, and context. If it reads r.Body, it must restore the body before
// returning so the server can decode it.
type Authorizer[T any] interface {
	AuthorizeRequest(*http.Request) (CommandAuthorizer[T], error)
}

type AuthorizerFunc[T any] func(*http.Request) (CommandAuthorizer[T], error)

func (f AuthorizerFunc[T]) AuthorizeRequest(r *http.Request) (CommandAuthorizer[T], error) {
	if f == nil {
		return nil, errNilAuthorizerFunc
	}

	return f(r)
}

type requestAuthorizer func(*http.Request) (commandAuthorizer, error)
type commandAuthorizer func(context.Context, queryParams) error

// WithAuthorizer decodes each complete JSON envelope into a fresh T before
// command authorization. Payload decoding failures reject the command with
// ErrInvalidCommand; HTTP GET skips decoding and uses the zero value of T.
func WithAuthorizer[T any](authorizer Authorizer[T]) Option {
	return optionFunc(func(cfg *config) error {
		if authorizer == nil || isNilValue(authorizer) {
			return errNilAuthorizer
		}

		cfg.authorizer = func(r *http.Request) (commandAuthorizer, error) {
			authorize, err := authorizer.AuthorizeRequest(r)
			if err != nil || authorize == nil {
				return nil, err
			}
			return func(ctx context.Context, params queryParams) error {
				var payload T
				if _, empty := any(&payload).(*struct{}); !empty && params.raw != nil {
					if err := json.Unmarshal(params.raw, &payload); err != nil {
						attrs := []any{"error_type", fmt.Sprintf("%T", err)}
						var typeErr *json.UnmarshalTypeError
						if errors.As(err, &typeErr) {
							attrs = append(attrs, "field", typeErr.Field, "offset", typeErr.Offset, "target_type", typeErr.Type.String())
						}
						cfg.logger.Warn("server: failed to decode command payload", attrs...)
						return fmt.Errorf("%w: decode command payload: %w", ErrInvalidCommand, err)
					}
				}
				return authorize(ctx, Command[T]{typ: *params.Type, sql: *params.SQL, payload: payload})
			}, nil
		}
		return nil
	})
}
