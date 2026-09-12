# Go Server Preaggregation

Programs embedding [`duckdb-server-go`](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go) can enable server-owned preaggregation with `server.WithPreaggregation`. It accepts `preagg` over HTTP POST or WebSocket messages and returns `{ catalog, schema, table, createdAt }`; clients use a REST or socket connector with `preagg: { mode: 'preagg' }` on their coordinator. The installed Go binary, Python server, and Node data server do not enable this command.

## WithPreaggregation

`server.WithPreaggregation(server.PreAggregateOptions{Catalog, Limits, Scope})`

- `Catalog`: writable destination catalog; defaults to the database's current catalog. Source catalogs may be attached read-only.
- `Scope`: required function from `context.Context` to `(query.PreAggregateScope, error)`, called for each command. Resolve it from authenticated application state.
- `Limits`: `query.PreAggregateLimits`; zero fields use the defaults below.

WebSocket context values come from the upgrade request and remain fixed for that connection. To observe authorization changes before reconnect, the scope resolver must consult current application state on each call.

A `query.PreAggregateScope` contains a nonempty `Key` and `Sources`, a slice of `query.PreAggregateNamespace{Catalog, Schema}` grants. The key identifies effective permissions, row restrictions, execution settings, and any data revision that changes sharing. It is persisted in plaintext in table metadata, so use a policy identifier, not a bearer token or other secret. It partitions storage and does not add row filters; enforce those through trusted views or `WithAuthorizer`. All physical source references must use `catalog.schema.table`; nonrecursive CTE names remain unqualified. Physical identifier spelling must match the grants. Empty `Sources` permits only queries without physical sources; temporary, system, introspection, and managed namespaces cannot be source grants.

In Mosaic SQL, pass `new TableRefNode(['raw', tenant, 'events'])` to `Query.from`; a dotted string is treated as one quoted identifier.

For example, if every reader of a tenant has access to its entire source schema:

```go
type tenantKey struct{}

handler, err := server.New(db, server.WithPreaggregation(server.PreAggregateOptions{
    Scope: func(ctx context.Context) (query.PreAggregateScope, error) {
        tenant, ok := ctx.Value(tenantKey{}).(string)
        if !ok {
            return query.PreAggregateScope{}, server.ErrUnauthenticated
        }
        return query.PreAggregateScope{
            Key: "reader-policy-v1:" + tenant,
            Sources: []query.PreAggregateNamespace{{Catalog: "raw", Schema: tenant}},
        }, nil
    },
}))
```

Outer authentication middleware supplies the tenant in this example. Change the key when effective permissions, execution context, or the host's data revision changes. Reset the client's preaggregator when changing authorization or destination configuration; references from other scopes or destination catalogs are denied.

The server assigns a `mosaic_preagg_<scope hash>` schema and a `preagg_<SQL hash>` table. It accepts one SELECT, checks source grants and the database's configured policies, and limits functions to the reviewed compute functions. Parameters, recursive CTEs, introspection materializations, replacement scans, and dependencies on other managed preaggregates are rejected. `DESCRIBE SELECT` remains available for source metadata. Host-defined views, macros, native extensions, and connection initialization must be trusted.

This option disables client `exec` and cannot be combined with `WithSchemaMatchHeaders`. `WithAuthorizer` still sees every submitted command. On a derived read, it also receives each stored source recipe as a `CommandPreagg`, so custom policy can revoke access to already materialized data. These source checks receive the current read's application payload, freshly decoded for each check; `Type()` and `SQL()` identify the stored source recipe. For GET reads, the payload remains the zero value of the application type. Authorizers that inspect SQL must accept authorized reads of server-managed references as well as the original source SELECTs. Source grants and function policies are rechecked on reads and reuse.

## Storage and lifetime

Tables and their source metadata are published together in a transaction. The metadata is stored in a server-owned table comment and checked before reuse; a matching table name alone does not permit reuse. Missing or invalid metadata on an existing table denies reuse and reads; trusted host cleanup must remove that table before it can be rebuilt.

Identical concurrent builds share one result. Distinct builds from a dashboard's charts wait for the single build lane, up to `MaxPendingBuilds` active and queued builds. Further distinct builds receive `resource_exhausted`. Each caller can cancel its own wait; admitted builds continue under a server-owned deadline that includes queue time, so one disconnected caller does not cancel other callers' work. With at least two SQL connections, other HTTP reads can continue; a one-connection pool is rejected.

| Limit | Default | Meaning |
| --- | --- | --- |
| `MaxTables` | 128 | Published tables across scopes |
| `MaxTablesPerScope` | 32 | Published tables for one scope |
| `MaxPendingBuilds` | 32 | Distinct active and queued builds across scopes |
| `MaxRows` | 1,000,000 | Rows in one published table |
| `MaxBytes` | 32 MiB | Arrow IPC size of one published table |
| `Timeout` | 90 seconds | Deadline for queueing and materialization |
| `TTL` | 24 hours | Maximum reusable table age |

Source SQL is limited to 1 MiB. Rows and Arrow IPC bytes are checked before commit. An oversized or failed build rolls back its table and any pending evictions. When capacity is needed, the oldest tables are evicted; expired tables and empty managed schemas are pruned during materialization. Expired references trigger recovery even before physical cleanup. Reuse preserves `createdAt`; rebuilding updates it.

These are publication limits. Configure DuckDB's process memory and spill limits separately, for example by executing `SET memory_limit = '1GB'` and `SET max_temp_directory_size = '4GB'` during trusted connection initialization. Arrow size is not physical disk or peak query memory usage. Source changes are observed after expiry/rebuilding or a scope-key revision; this API has no refresh operation.

Use one handler to own the managed namespaces in a destination catalog, and do not modify its tables or comments outside host cleanup. Ordinary tables work across the Go server's SQL and Arrow connection pools. A retained database can reuse verified metadata after handler restart; an empty replacement database can rebuild missing references under the same scope and destination. Multiple replicas need request affinity or compatible shared storage.

## Errors

With preaggregation enabled, HTTP command errors use JSON `{ error, code }`, and responses use `Cache-Control: no-store` even when `WithCacheControl` configures caching. GET responses omit ETags and ignore conditional request headers; every read is authorized and executed.

| Code | HTTP status |
| --- | --- |
| `bad_request` | 400 |
| `unauthenticated` | 401 |
| `forbidden` | 403 |
| `table_not_found` | 404 |
| `resource_exhausted` | 429 |
| `internal_error` | 500 |
| `deadline_exceeded` | 504 |

`table_not_found` includes `catalog`, `schema`, and `table` only for a missing or expired reference in the caller's managed scope. The coordinator can then rebuild and retry once. Unrelated source failures and unauthorized references do not receive this recovery signal. GET materialization requests are rejected. WebSockets use the same command handler and error envelopes, with no HTTP status field. Responses remain in request order, and the connection remains usable after a failed or timed-out build. A build delays later commands on that socket.

Programs using `pkg/query` directly can construct `query.NewPreAggregator(ctx, db, catalog, limits)`, call `Materialize(ctx, scope, sql)` for a `query.PreaggResponse`, and call `QueryArrow(ctx, scope, sql, authorizeSource)` for scoped reads. `authorizeSource`, when provided, reauthorizes stored source SELECTs. `query.MissingPreAggregateError` carries the three reference fields; `query.ErrPreAggregateLimit` identifies admission or output limits. Direct callers own request authentication and initial command authorization.
