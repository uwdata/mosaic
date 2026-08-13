package server

import (
	"context"
	"errors"
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

func (c Command) Type() CommandType {
	return c.typ
}

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

type AuthorizerFunc func(*http.Request) (CommandAuthorizer, error)

func (f AuthorizerFunc) AuthorizeRequest(r *http.Request) (CommandAuthorizer, error) {
	if f == nil {
		return nil, errNilAuthorizerFunc
	}

	return f(r)
}
