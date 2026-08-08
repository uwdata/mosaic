package server

import (
	"context"
	"encoding/json"
)

// commandExecutor is private so the server package does not expose query's
// current schema-policy plumbing as a supported extension point.
type commandExecutor interface {
	Exec(context.Context, string) error
	QueryArrow(context.Context, string, []string, bool) ([]byte, bool, error)
	QueryJSON(context.Context, string, []string, bool) (json.RawMessage, bool, error)
}
