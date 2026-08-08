package server

import (
	"context"
	"errors"
	"net/http"
)

var (
	// ErrUnauthenticated indicates that a request has no valid authentication.
	ErrUnauthenticated = errors.New("server: unauthenticated")
	// ErrPermissionDenied indicates that an authenticated request is not allowed
	// to execute a command.
	ErrPermissionDenied = errors.New("server: permission denied")
	// ErrInvalidCommand indicates that a command cannot be authorized because it
	// is malformed or unsupported.
	ErrInvalidCommand = errors.New("server: invalid command")

	errNilAuthorizerFunc = errors.New("server: nil AuthorizerFunc")
)

// CommandType identifies the result format or operation requested by a command.
type CommandType string

const (
	CommandArrow CommandType = "arrow"
	CommandExec  CommandType = "exec"
	CommandJSON  CommandType = "json"
)

// Command is the immutable command information presented for authorization.
// Commands are created by the server only after request decoding and validation.
type Command struct {
	typ CommandType
	sql string
}

func newCommand(typ CommandType, sql string) Command {
	return Command{typ: typ, sql: sql}
}

// Type returns the command's normalized operation type.
func (c Command) Type() CommandType {
	return c.typ
}

// SQL returns the exact SQL text that will be executed.
func (c Command) SQL() string {
	return c.sql
}

// CommandAuthorizer authorizes one decoded and validated command from a request.
// Returning a non-nil error denies the command. Unexpected errors are sanitized
// as internal authorization failures.
type CommandAuthorizer func(context.Context, Command) error

// Authorizer creates the command authorizer used for a single HTTP request or
// WebSocket session. AuthorizeRequest is called before a POST body is decoded
// or a WebSocket is upgraded. It should normally inspect the request line,
// headers, and context. If it reads r.Body, it must restore the body before
// returning so the server can decode it.
type Authorizer interface {
	AuthorizeRequest(*http.Request) (CommandAuthorizer, error)
}

// AuthorizerFunc adapts a function to the Authorizer interface.
type AuthorizerFunc func(*http.Request) (CommandAuthorizer, error)

// AuthorizeRequest calls f. A nil AuthorizerFunc returns an internal error
// instead of panicking.
func (f AuthorizerFunc) AuthorizeRequest(r *http.Request) (CommandAuthorizer, error) {
	if f == nil {
		return nil, errNilAuthorizerFunc
	}

	return f(r)
}
