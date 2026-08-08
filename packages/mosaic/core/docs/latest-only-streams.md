# Latest-Only Stream Scheduling

## Problem
Interactive applications often generate high-frequency query streams (e.g., brushing, slider dragging). Sending every intermediate query to the server can cause:
1.  **Backlog Latency:** The server queues up stale requests, delaying the "latest" relevant result.
2.  **Wasted Work:** Computing results for chart states that the user has already passed.

## API
The `Coordinator.query()` method accepts two new options:

```typescript
coord.query(sql, {
  stream: 'my-interaction-id', // Group requests by this ID
  latest: true                 // Enable pruning of stale requests
});
```

## Semantics
When `latest: true` is set:
1.  **Queue Pruning:** Any *pending* (queued but not yet sent) requests with the same `stream` ID are removed from the client-side queue.
2.  **Stale Suppression:** If a request was already sent (inflight) and returns *after* a newer request was issued, its result is rejected with `"Stale"` to prevent UI jitter.

## Limitations
*   **No Server Cancellation:** This feature does not interrupt queries already executing on the database. It only prevents new stale queries from being sent and suppresses stale results.
