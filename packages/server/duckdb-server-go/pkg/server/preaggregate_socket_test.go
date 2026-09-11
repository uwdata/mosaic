package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
	"github.com/stretchr/testify/require"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

func newPreaggregateWebSocket(t *testing.T, limits query.PreAggregateLimits) (*webSocketTestServer, *query.DB) {
	t.Helper()
	h, db := setupPreaggregateHandler(t, limits)
	scope := query.PreAggregateScope{Key: "tenant:reader", Sources: []query.PreAggregateNamespace{{Catalog: "memory", Schema: "tenant"}}}
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), preaggregateScopeKey{}, scope)))
	})
	return newWebSocketTestServer(t, handler), db
}

func TestWebSocketPreaggregate(t *testing.T) {
	server, db := newPreaggregateWebSocket(t, query.PreAggregateLimits{})
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
	var failure map[string]string
	require.NoError(t, wsjson.Read(server.ctx, conn, &failure))
	require.Equal(t, "bad_request", failure["code"])
	var again query.PreaggResponse
	require.NoError(t, wsjson.Read(server.ctx, conn, &again))
	require.Equal(t, first, again)

	ref := fmt.Sprintf("%s.%s.%s", first.Catalog, first.Schema, first.Table)
	require.NoError(t, db.Exec(server.ctx, "DROP TABLE "+ref))
	require.NoError(t, wsjson.Write(server.ctx, conn, map[string]any{"type": CommandArrow, "sql": "SELECT * FROM " + ref}))
	require.NoError(t, wsjson.Write(server.ctx, conn, map[string]any{"type": CommandPreagg, "sql": source}))
	require.NoError(t, wsjson.Read(server.ctx, conn, &failure))
	require.Equal(t, map[string]string{"error": "Not Found", "code": "table_not_found", "catalog": first.Catalog, "schema": first.Schema, "table": first.Table}, failure)
	require.NoError(t, wsjson.Read(server.ctx, conn, &again))
	require.True(t, again.CreatedAt.After(first.CreatedAt))
	require.NoError(t, wsjson.Write(server.ctx, conn, map[string]any{"type": CommandArrow, "sql": "SELECT * FROM " + ref + " ORDER BY dim"}))
	kind, payload, err = conn.Read(server.ctx)
	require.NoError(t, err)
	require.Equal(t, websocket.MessageBinary, kind)
	require.Equal(t, []map[string]any{{"dim": "a", "n": float64(1)}, {"dim": "b", "n": float64(2)}}, arrowRows(t, payload))
}

func TestWebSocketPreaggregateDeadline(t *testing.T) {
	server, _ := newPreaggregateWebSocket(t, query.PreAggregateLimits{Timeout: 10 * time.Millisecond})
	conn, _, err := server.dial(nil)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, conn.CloseNow()) })
	require.NoError(t, wsjson.Write(server.ctx, conn, map[string]any{"type": CommandPreagg, "sql": "SELECT sum(i) AS n FROM range(1000000000) t(i)"}))
	require.NoError(t, wsjson.Write(server.ctx, conn, map[string]any{"type": CommandArrow, "sql": "SELECT 1 AS n"}))
	var failure map[string]string
	require.NoError(t, wsjson.Read(server.ctx, conn, &failure))
	require.Equal(t, "deadline_exceeded", failure["code"])
	kind, payload, err := conn.Read(server.ctx)
	require.NoError(t, err)
	require.Equal(t, websocket.MessageBinary, kind)
	require.Equal(t, []map[string]any{{"n": float64(1)}}, arrowRows(t, payload))
}
