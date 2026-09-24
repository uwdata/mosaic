package server

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
	"github.com/stretchr/testify/require"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

func newPreaggregateWebSocket(t *testing.T) (*webSocketTestServer, func(string)) {
	t.Helper()
	h, trusted := setupPreaggregateHandler(t)
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), preaggregateScopeKey{}, preaggregateScope)))
	})
	return newWebSocketTestServer(t, handler), trusted
}

func TestWebSocketPreaggregate(t *testing.T) {
	server, trusted := newPreaggregateWebSocket(t)
	conn, _, err := server.dial(nil)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, conn.CloseNow()) })
	source := `SELECT dim, count(*) AS n FROM memory.tenant.source GROUP BY dim`
	for _, command := range []map[string]any{
		{"type": CommandPreagg, "sql": source},
		{"type": CommandArrow, "sql": "SELECT count(*) AS n FROM memory.tenant.source"},
		{"type": CommandExec, "sql": "CREATE TABLE injected AS SELECT 1"},
		{"type": CommandPreagg, "sql": source},
	} {
		require.NoError(t, wsjson.Write(server.ctx, conn, command))
	}
	kind, payload, err := conn.Read(server.ctx)
	require.NoError(t, err)
	require.Equal(t, websocket.MessageText, kind)
	var first query.PreaggResponse
	require.NoError(t, json.Unmarshal(payload, &first))
	require.False(t, first.CreatedAt.IsZero())
	kind, payload, err = conn.Read(server.ctx)
	require.NoError(t, err)
	require.Equal(t, websocket.MessageBinary, kind)
	require.Equal(t, []map[string]any{{"n": float64(3)}}, arrowRows(t, payload))
	var failure struct {
		Code      string          `json:"code"`
		Reference query.Reference `json:"reference"`
	}
	require.NoError(t, wsjson.Read(server.ctx, conn, &failure))
	require.Equal(t, "bad_request", failure.Code)
	var again query.PreaggResponse
	require.NoError(t, wsjson.Read(server.ctx, conn, &again))
	require.Equal(t, first, again)

	ref := first.Reference.String()
	trusted("DROP TABLE " + ref)
	require.NoError(t, wsjson.Write(server.ctx, conn, map[string]any{"type": CommandArrow, "sql": "SELECT * FROM " + ref}))
	require.NoError(t, wsjson.Write(server.ctx, conn, map[string]any{"type": CommandPreagg, "sql": source}))
	require.NoError(t, wsjson.Read(server.ctx, conn, &failure))
	require.Equal(t, "table_not_found", failure.Code)
	require.Equal(t, first.Reference, failure.Reference)
	require.NoError(t, wsjson.Read(server.ctx, conn, &again))
	require.True(t, again.CreatedAt.After(first.CreatedAt))
	require.NoError(t, wsjson.Write(server.ctx, conn, map[string]any{"type": CommandArrow, "sql": "SELECT * FROM " + ref + " ORDER BY dim"}))
	kind, payload, err = conn.Read(server.ctx)
	require.NoError(t, err)
	require.Equal(t, websocket.MessageBinary, kind)
	require.Equal(t, []map[string]any{{"dim": "a", "n": float64(1)}, {"dim": "b", "n": float64(2)}}, arrowRows(t, payload))
}
