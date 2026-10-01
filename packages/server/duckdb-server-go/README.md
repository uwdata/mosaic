# DuckDB Go Server

A Go-based server that runs a local DuckDB instance and supports queries over HTTP/HTTPS, returning data in [Apache Arrow](https://arrow.apache.org/) format.

_Note:_ This package provides a local DuckDB server. To instead use DuckDB-WASM in the browser, use the `wasmConnector` in the [`mosaic-core`](https://github.com/uwdata/mosaic/tree/main/packages/mosaic/mosaic-core) package.

## Usage

Install the server with `go install`.

```sh
go install -tags=duckdb_arrow github.com/uwdata/mosaic/packages/server/duckdb-server-go@latest
```

Then run the server with

```sh
duckdb-server-go
```

### Command-Line Options

You can customize the server behavior with the following command-line flags:

-   `--database <path>`: Path to a DuckDB database file (e.g., "database.db"). Defaults to an in-memory database.
-   `--address <address>`: The HTTP address to listen on. Defaults to "localhost".
-   `--port <port>`: The HTTP port to listen on. Defaults to "3000".
-   `--connection-pool-size <size>`: The maximum size of the connection pool. Defaults to 10.
-   `--cert <path>`: Path to a TLS certificate file to enable HTTPS.
-   `--key <path>`: Path to a TLS private key file to enable HTTPS.
-   `--cache-control <value>`: Cache-Control value for successful GET `arrow` responses, enabling ETags and conditional responses for those queries. Omitted or empty values preserve existing behavior.
-   `--vary <headers>`: Comma-separated request header names to append to Vary independently of Cache-Control. Repeated flags accumulate names.
-   `--load-extensions`: Comma-separated list of extensions to install and load at startup. Use a pipe after the extension name to specify a DuckDB repository alias. Unspecified repositories use DuckDB's default (e.g. `mysql_scanner,netquack|community,aws|core_nightly`).
-   `--gatekeeper <json>`: Complete Gatekeeper JSON policy document, passed verbatim to `gatekeeper_configure(json := ...)`. `{"version":2,"options":{}}` enables validation with defaults. May be specified once.

By default, the server looks for `localhost.pem` and `localhost-key.pem` in the current directory, then in the shared OS user configuration directory under `mosaic/https`, if the `--cert` and `--key` flags are not provided.

For compatibility, the installed binary permits all HTTP origins. A cross-site page can therefore submit
commands, including side-effecting `exec` commands over GET, to a running server. Do not expose the binary to untrusted
browsers or cookie credentials without an outer proxy that enforces an origin or CSRF policy. Programs embedding
`pkg/server` instead receive safe zero-value origin defaults and can configure exact allowed origins.

### Local HTTPS

Install [native mkcert](https://github.com/FiloSottile/mkcert) on `PATH`, then from the repository root, set up certificates shared by Node, Rust, and Go:

```sh
pnpm mkcert
pnpm server:go
```

Standalone users can install [native mkcert](https://github.com/FiloSottile/mkcert) and generate a pair in the server's working directory:

```sh
mkcert -install
mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1 ::1
duckdb-server-go
```

Explicit `--cert` and `--key` override current-directory and shared pairs. The server only loads certificates; generate or renew them separately, then restart. Without certificates, the server uses HTTP.

See the [server guide](../README.md) for platform paths, browser trust, and renewal.

### Programmatic Extension Initialization

Use `pkg/extensions` from a DuckDB connector callback:

```go
connector, err := duckdb.NewConnector(":memory:", func(execer driver.ExecerContext) error {
	return extensions.ParseAndInstall(connectorCtx, execer, "httpfs", "netquack|community")
})
```

Repository suffixes are DuckDB aliases. Use `InstallAndLoadFromCustomRepository` for repository URLs or paths, and
`LoadInstalled`, `LoadFile`, or `InstallAndLoadFile` for pre-provisioned extensions. The callback runs for every physical
connection; use a long-lived context and call `PingContext` before serving to force initialization. The first failure
aborts the connection. Extensions are trusted native code, so load only trusted repositories and files.

### Programmatic Authorization

Programs embedding `pkg/server` should authenticate with standard HTTP middleware around the handler returned by
`server.New`, then use `server.WithAuthorizer` only for command-aware policy. Middleware is the only place to reject a
request before the handler reads its body. The authorizer runs once per command, after the handler decodes it and
checks its type and SQL, and before policy validation or execution. POST bodies are already consumed by then, so use
`Payload()`. The authorizer must be concurrency-safe. Outer middleware must decide whether CORS preflight `OPTIONS`
requests may reach the server.

Omitting `WithAuthorizer` adds no application authorization, and a nil authorizer makes `New` fail.
Authorizer errors map to statuses like the server's own: `ErrUnauthenticated`, `ErrPermissionDenied`, and
`ErrInvalidCommand` map to HTTP 401, 403, and 400, wrapped query validation errors keep the statuses described under
[Gatekeeper Configuration](#gatekeeper-configuration), and other errors map to 500. Every error response carries the
error's message verbatim, including authorizer errors and Gatekeeper diagnostics; the server does not sanitize them, so
redact what callers shouldn't see in the authorizer or in middleware. The server logs each error response once, at ERROR
for 5xx statuses and WARN otherwise, except for canceled or timed-out requests. Authorization can allow or deny the
normalized command type and exact SQL, but cannot rewrite SQL or sandbox the shared process, filesystem, network,
extensions, catalogs, or credentials.

The authorizer returns `(*query.ValidationPolicy, error)`: an error denies the command, `nil, nil` adds no restrictions, and `policy, nil` validates on the execution connection and rejects `exec`. DB-level `query.WithValidation()` applies even when the returned policy is nil.

### HTTP Response Caching

Configure caching and request-header variation independently:

```go
handler, err := server.New(db,
	server.WithCacheControl("private, max-age=60"),
	server.WithVary("X-Tenant-Id"),
)
```

`WithCacheControl(value)` sets the complete header value on successful GET `arrow` responses. The application chooses storage, sharing, and freshness directives, such as `no-store`, `private, max-age=60`, or `public, max-age=60, s-maxage=300`. An omitted or empty value preserves existing behavior, including any headers set by outer middleware. Configured values replace an existing Cache-Control header; other responses, including errors, `exec`, POST, and OPTIONS, receive `no-store`. HEAD is unsupported and returns `405`; only GET query responses are cacheable. `WithPreaggregation` takes precedence: its responses use `no-store`, omit ETags, and ignore conditional request headers.

For GET `arrow` responses, enabling Cache-Control also generates a strong ETag from the serialized Arrow bytes. A matching `If-None-Match` returns `304` with no body and the applicable Cache-Control, ETag, and Vary headers. Tag lists, weak comparisons, and `*` are supported. `If-Match` uses strong comparison and takes precedence, returning `412` without an ETag on a mismatch. Other command types and methods, including `exec` and POST, ignore conditional request headers; `If-Match` cannot guard an `exec` command. Authorization, query validation, execution, serialization, and hashing of the complete response still run before evaluating validators: revalidation saves transfer bandwidth. Changes to data do not invalidate already-fresh HTTP cache entries before their configured lifetime expires. Compressed responses carry an encoding-specific ETag; see [HTTP Response Compression](#http-response-compression).

`WithVary(headers ...string)` accepts individual names or a slice with `headers...`. Names are copied, trimmed, canonicalized, and deduplicated; `*` is accepted. They append to existing Vary values, including CORS fields, on every response. `WithVary()` configures no additional names. Each option replaces earlier configuration of the same option. Invalid header characters are rejected during server construction; Cache-Control directives are otherwise passed through.

Applications must explicitly configure headers affecting authorization or results using `WithVary` / `--vary`.

Caches must include the complete GET query string, including `type` and `sql`, and distinguish all Vary headers. Vary partitions cache entries; it does not authorize requests. Shared caches serving protected data must enforce access control before cache lookup. HTTP caching is separate from the coordinator's application cache.

The equivalent command-line settings are:

```sh
duckdb-server-go --cache-control='private, max-age=60' --vary=X-Tenant-Id
```

### HTTP Response Compression

HTTP responses of at least 1 KiB are compressed with gzip or zstd according to the request's `Accept-Encoding` header, preferring zstd when the client accepts both, and every command response carries `Vary: Accept-Encoding`. Compression is always enabled and cannot be configured; outer middleware and proxies should not compress again. Compressed request bodies are not accepted.

A compressed GET `arrow` response keeps a strong ETag with `-gzip` or `-zstd` inserted before the closing quote, so the tag identifies the encoded representation as [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.3.1) requires. The server determines the representation it will send, including the size threshold, before evaluating `If-None-Match` and `If-Match`, so a tag from a differently encoded response does not match and a `304` carries the selected representation's tag. Responses below the size threshold and clients that do not accept compression receive the plain tag.

### Application Command Fields

Application fields can be siblings of `type` and `sql` or nested, for example under `meta`. Mosaic defines no metadata schema. Choose the complete envelope's Go type with `Authorizer[T]`; `command.Payload()` returns it. `WithAuthorizer` infers `T`, while `New` stays non-generic.

For example, an application can limit commands to its `dashboard` project, with GET parameters as a fallback:

```go
type Fields struct {
	Project string `json:"project"`
}

authorizer := func(r *http.Request, command server.Command[*Fields]) (*query.ValidationPolicy, error) {
	project := r.URL.Query().Get("project")
	if fields := command.Payload(); fields != nil {
		project = fields.Project
	}
	if project != "dashboard" || command.Type() == server.CommandExec {
		return nil, server.ErrPermissionDenied
	}
	return nil, nil
}

handler, err := server.New(db,
	server.WithAuthorizer(authorizer),
	server.WithMaxBytes(1<<20),
)
```

Each POST command decodes into a fresh `T` using `encoding/json`. `Payload()` returns that value without copying; mutations cannot change the authoritative `Type()` or `SQL()`. Custom decoders are responsible for their own sharing and must account for protocol keys (`type` and `sql`) when rejecting unknown fields.

Use structs, maps, or custom `UnmarshalJSON` implementations as needed. `json.RawMessage` preserves JSON value bytes, not surrounding whitespace. If no application fields are needed, `struct{}` skips application decoding.

GET skips JSON decoding and supplies the zero value of `T` (`nil` for pointers); read query parameters from `r.URL.Query()` inside the authorizer. Payload decoding failures reject the command with HTTP 400 before the authorizer runs; the response and a warning log include the decode error.

Application fields are untrusted: combine them with authenticated identity, as shown in the compiled [`ExampleNew`](pkg/server/example_test.go). Client caching can bypass the connector, and consolidation can discard query options. If fields affect results or access, isolate coordinator/cache/consolidation state per scope or disable that reuse.

`WithMaxBytes(n)` requires a positive byte limit for entire HTTP request bodies and applies it with the standard library's `http.MaxBytesHandler`. The limit wraps every request once it reaches the handler; reading past the limit fails the request. Request bodies are unbounded by default. Exceeding the limit returns HTTP 413 with `Connection: close`. Middleware that reads the body first, for example to verify a request signature, needs its own bound, such as `http.MaxBytesHandler(verify(handler), n)`; it must answer `*http.MaxBytesError` with 413 and restore `r.Body` before calling the handler.

POST bodies require one complete command object with optional surrounding whitespace; trailing data is rejected. Protocol decoding failures return HTTP 400. Method (405), size (413), and decoding or parameter (400) failures all occur before the authorizer runs.

### Gatekeeper Configuration

Gatekeeper is optional. Enable validation with a [Gatekeeper JSON policy](https://github.com/nozzle/duckdb-gatekeeper#json-policy-documents) (version 2, which requires 0.4.0+):

```sh
duckdb-server-go --gatekeeper='{"version":2,"options":{}}'
```

The CLI loads Gatekeeper (installing from community if needed), passes the document unchanged to `gatekeeper_configure`, disables extension autoload/autoinstall, and locks configuration. `--load-extensions` can provide a local artifact first. Upgrade cached installations with `FORCE INSTALL gatekeeper FROM community`, then restart.

For Go applications, load Gatekeeper during trusted setup and call `query.ConfigureGatekeeper(ctx, execer, document)` before locking configuration. Global policy, autoload/autoinstall settings, and configuration locking must run once per database, not per pooled connection; guard the setup with `sync.Once` and retain its error as [main.go](main.go) does. `query.New` does not load extensions; `query.WithValidation()` requires Gatekeeper and enables validation for every Arrow query. `db.Close()` also closes the connector.

`db.Query(ctx, sql, policy)` returns the complete Arrow IPC result as `[]byte`, or nil on error. Pass `*query.ValidationPolicy` directly or from `WithAuthorizer` to narrow the global policy. Use `JSON: &document` or typed `AllowedTables`, `BlockedTables`, `AllowedFunctions`, `BlockedFunctions`, and `UseDefaultFunctions` fields; the two forms cannot be mixed. Nil slices omit options; empty slices remain explicit arrays. `TableRule` and `FunctionRule` take a nonempty `SchemaPath`, outermost schema first; `Catalog` fields and `UseDefaultFunctions` are pointers, and an empty `FunctionRule.Type` matches any function kind. Names are passed unchanged, including whitespace.

`ValidateSQL(ctx, sql, policy)` returns `(ValidationResult, error)` without executing. `Details` contains diagnostics and violations; successful results include `CallerObjects`, `CallerFunctions`, transitive `Objects`, and `Functions`. Use `errors.AsType[query.ErrorDetails]`, or `errors.Is` with `ErrValidation`, `ErrAccessDenied`, `ErrUnsupportedStatement`, and `ErrInvalidPolicy`. HTTP validation errors return 403 for policy denials, 400 for SQL errors, and 500 for invalid application policies or validator failures, with the complete diagnostic in the body. Gatekeeper documents its diagnostics as host-only, so redact them before exposing the server to untrusted callers.

Validated execution uses the same connection for validation and execution and rejects `exec`. Mosaic pre-aggregation therefore needs either `preagg: { enabled: false }` on the client or server-owned preaggregation below. Trusted views/macros can expose their dependencies. See Gatekeeper's [policy schema](https://github.com/nozzle/duckdb-gatekeeper/blob/v0.4.1/docs/policy-v2.schema.json), [version 1 migration guide](https://github.com/nozzle/duckdb-gatekeeper/blob/v0.4.1/docs/policy-migration.md), and [security model](https://github.com/nozzle/duckdb-gatekeeper/blob/v0.4.1/docs/security.md) for policy semantics and resource boundaries.

### Server-Owned Preaggregation

Embedding applications can enable the `preagg` command with `server.WithPreaggregation[T]`. It requires a DB built with `query.WithValidation()`: Gatekeeper is the only statement authority, so source SELECTs and reads of managed tables are never inspected in Go. The table policy returned by `WithAuthorizer` governs which sources a caller may materialize; reads additionally see the caller's own namespace. A `query.Materializer` chooses the physical form: `TableMaterializer` (default) runs `CREATE TABLE AS`; `ParquetMaterializer` copies to a Parquet file and publishes a view, so replicas sharing an object store reuse each other's files. The server publishes with source metadata transactionally and reauthorizes the stored source SELECT on every read.

The installed binary does not enable this option. Clients use a REST connector with `preagg: { mode: 'preagg' }` on their coordinator.

#### WithPreaggregation

`server.WithPreaggregation[T](server.PreAggregateOptions[T]{Materializer, Namespace})`

- `Namespace`: function from `(context.Context, server.Command[T])` to `(query.Namespace, error)` returning the `{Catalog, Schema}` this caller's tables live in; `Schema` is a path (`[]string`) matching the protocol's `TableReference` and Gatekeeper's `schema_path`, and must have exactly one component until DuckDB supports nested schemas. An empty catalog means the current one. Nil puts everyone's tables in the `mosaic_preagg` schema of the current catalog. `T` is the application payload type decoded from the command envelope, as in [`WithAuthorizer`](#application-command-fields), so a tenant or project identifier in the request can name the schema; HTTP GET commands carry the zero value of `T`.
- `Materializer`: the physical form of managed tables, described under [Materializers](#materializers); nil uses `query.TableMaterializer`.

The server owns every object in a namespace and names tables `preagg_<sha256(sql)>`, so a repeated request finds the existing table. Use one namespace per tenant when the same SQL text yields different rows for different callers (a view that reads session state, a per-tenant search path); otherwise one shared namespace is enough, because reads are gated by revalidating the stored source SELECT under the reader's policy. Rename the namespace to discard everything in it.

Which sources a caller may read comes from the `*query.ValidationPolicy` that [`WithAuthorizer`](#programmatic-authorization) returns for the command, narrowed under the database-wide Gatekeeper ceiling. The policy must use the typed fields; a `JSON` document is rejected because the namespace has to be appended to its table rules. A `preagg` command validates the source SELECT under that policy and denies any dependency on the namespace. An `arrow` command validates under the same policy plus the caller's namespace. Every managed table the read binds, in any namespace the policy allows, is recognized by its stored metadata and has its source SELECT revalidated; ordinary and temporary tables outside the namespace are left alone; a managed table in the caller's own namespace that is missing or was not published by this server is `table_not_found` or `forbidden` respectively. Without an authorizer, the global ceiling alone applies.

The global policy set with `gatekeeper_configure` must leave `allowed_tables` unrestricted (or use `blocked_tables`) unless it lists every namespace; put table restrictions in the request policy.

For example, if every reader of a tenant has access to its entire source schema:

```go
type tenantKey struct{}

func tenant(ctx context.Context) (string, error) {
    tenant, ok := ctx.Value(tenantKey{}).(string)
    if !ok {
        return "", server.ErrUnauthenticated
    }
    return tenant, nil
}

handler, err := server.New(db,
    server.WithPreaggregation(server.PreAggregateOptions[struct{}]{
        Namespace: func(ctx context.Context, _ server.Command[struct{}]) (query.Namespace, error) {
            name, err := tenant(ctx)
            return query.Namespace{Schema: []string{"preagg_" + name}}, err
        },
    }),
    server.WithAuthorizer(func(r *http.Request, _ server.Command[struct{}]) (*query.ValidationPolicy, error) {
        name, err := tenant(r.Context())
        if err != nil {
            return nil, err
        }
        catalog := "raw"
        return &query.ValidationPolicy{AllowedTables: []query.TableRule{{Catalog: &catalog, SchemaPath: []string{name}, Table: "*"}}}, nil
    }),
)
```

Outer authentication middleware supplies the tenant in this example. Reset the client's preaggregator when changing authorization or namespace configuration.

Gatekeeper accepts one SELECT and checks tables and functions against the request policy and the global ceiling. Parameters that cannot bind, replacement scans without an admitted reader, dynamic SQL, catalog readers, and dependencies on other managed preaggregates are rejected. `DESCRIBE SELECT` remains available for source metadata. Host-defined views, macros, native extensions, and connection initialization must be trusted.

This option requires `query.WithValidation()`, which already disables client `exec`. `WithAuthorizer` sees every submitted command. On a derived read, it also receives each stored source SELECT as a `CommandPreagg`, and the policy it returns is what that source is revalidated under, so custom policy can revoke access to already materialized data. These source checks receive the current read's request and application payload, freshly decoded for each check; `Type()` and `SQL()` identify the stored source SELECT. For GET reads, the payload remains the zero value of the application type. Authorizers that inspect SQL must accept authorized reads of server-managed references as well as the original source SELECTs.

#### Materializers

A `query.Materializer` runs inside the publishing transaction, on the connection that validated the source SELECT, and must leave a table or view named by the reference. It returns `query.Stats{Rows, Bytes}`, which are stored with the table and returned in the `preagg` response as informational `rows` and `bytes`; `Bytes` is a ballpark from whatever the storage exposes cheaply, never a scan, and 0 means unknown. Two materializers are provided.

`query.TableMaterializer{}` runs `CREATE TABLE … AS`. It is the default. Rows come from table statistics; bytes are rows times the declared column widths, with 16 bytes assumed for strings, blobs, and nested types.

`&query.ParquetMaterializer{Directory}` runs `COPY (…) TO '<Directory>/<catalog>/<schema>/<table>.parquet'` and publishes a view over `read_parquet`. Each path segment is ASCII-lowercased (DuckDB folds identifier case over ASCII only, so `Ä` and `ä` stay distinct) and percent-encoded outside `[a-z0-9_-]`, so distinct namespaces never share a file and `.`/`/` in an identifier cannot escape the directory. `Directory` may be a local path or a DuckDB filesystem URL such as `s3://bucket/prefix` once the matching extension is loaded during trusted initialization. Because the path follows the reference, a replica that finds the file already present publishes its view without recomputing, and any replica sharing the directory serves the same data; `createdAt` then reflects that replica's publish time. Writes to one path are serialized within a process; across replicas, only the object store's atomic replacement guards concurrent writers of the same key. Stats come from the Parquet footer, so bytes are compressed size and cost a footer read on object stores. Nothing deletes files: use the location's lifecycle rules. Object stores never expose an interrupted upload, but an interrupted local write leaves a partial file that later publishes reuse, so give each replica its own local directory and clear it on restart.

Reads through a Parquet-backed view scan the file on every query. Where that is too slow, put the shared location behind `ParquetMaterializer` for durability and a local `TableMaterializer` replica cache in front; this package does not compose them.

#### Storage and lifetime

Tables or views and their source metadata are published together in a transaction on the requesting connection. The metadata is stored in a server-owned comment and checked before reuse; a matching name alone does not permit reuse. Missing or invalid metadata on an existing object denies reuse and reads; trusted host cleanup must remove that object before it can be rebuilt. Reuse preserves `createdAt`.

Builds run concurrently, bounded only by the connection pool and the request context. Callers that race to publish the same reference, or the same new schema, conflict in DuckDB's catalog; the loser returns the winner's table or retries against the committed schema. The Mosaic client already coalesces identical requests and builds one table at a time per coordinator, so this only arises across clients sharing a namespace.

Nothing is evicted, sized, aged, or timed out: published tables live until trusted host cleanup drops them, and source changes are observed only after the namespace is renamed. Bound work with DuckDB's own settings, for example `SET memory_limit = '1GB'` and `SET max_temp_directory_size = '4GB'` during trusted connection initialization, and with request timeouts in the HTTP server. Limits and expiry can be added when a deployment needs them.

Do not modify a namespace's tables or comments outside host cleanup. A retained database reuses verified metadata after restart; an empty replacement database rebuilds missing references under the same namespace. Multiple replicas need request affinity, or `ParquetMaterializer` over a shared directory.

#### Errors

With preaggregation enabled, HTTP command errors use the protocol's JSON envelope `{ error, code, reason, field?, reference? }`, and responses use `Cache-Control: no-store` even when `WithCacheControl` configures caching. `error` is the verbatim message described under [Programmatic Authorization](#programmatic-authorization). GET responses omit ETags and ignore conditional request headers; every read is authorized and executed.

| Code | HTTP status |
| --- | --- |
| `bad_request` | 400, or 405 and 413 for the method and size failures |
| `unauthenticated` | 401 |
| `forbidden` | 403 |
| `table_not_found` | 404 |
| `unsupported_command` | 400 |
| `internal_error` | 500 |

`reason` follows the protocol's closed vocabulary: `malformed_json`, `missing_field` and `invalid_field` (with `field`), `method_not_allowed`, `payload_too_large`, `sql_parse_error`, `unsupported_statement`, `command_disabled` (`preagg` unconfigured, or `exec` under validation), `policy_denied`, `access_denied`, `authentication_required`, `materialization_missing`, `execution_failed`, `validation_failed`, and `internal_failure`. A Gatekeeper binding failure on a user table is `500` with `execution_failed`.

`table_not_found` includes `reference` (`{ catalog, schema: [...], table }`) only for a missing table in the caller's namespace. The coordinator can then rebuild and retry once. Unrelated source failures and unauthorized references do not receive this recovery signal. GET materialization requests are rejected.

Programs using `pkg/query` directly can construct `query.NewPreAggregator(ctx, db, materializer)`, call `Materialize(ctx, namespace, sql, policy)` for a `query.PreaggResponse` (reference, `createdAt`, and stats), and call `Query(ctx, namespace, sql, policy, sourcePolicy)` for reads. `sourcePolicy`, when provided, returns the policy each stored source SELECT is revalidated under; nil reuses `policy`. `query.MissingPreAggregateError` carries the three reference fields. Direct callers own request authentication and initial command authorization.

## API

The server supports queries via HTTP GET and POST. GET uses `type` and `sql` query parameters, for example [this URL](<http://localhost:3000/?type=arrow&sql=select%201>).

POST requests take a JSON object with the command in `type` and query text in `sql`. The server supports the following commands.

### `exec`

Executes the SQL query in the `sql` field (rejected when [`--gatekeeper`](#gatekeeper-configuration) is enabled).

### `arrow`

Executes the SQL query in the `sql` field and returns the result in Apache Arrow format.

### `preagg`

Materializes the SELECT in the `sql` field into a server-managed table and returns `{ reference: { catalog, schema: [...], table }, createdAt, rows, bytes }` as JSON. Available only when the embedding application configures [server-owned preaggregation](#server-owned-preaggregation); otherwise the server returns `400 unsupported_command`.

## Developers

### Build

Build the release binary with:

```sh
go build -tags=duckdb_arrow -o duckdb-server-go .
```

### Develop

To run the server, use `go run` (this won't restart when the code changes):

```sh
go run -tags=duckdb_arrow .
```

Before sending a pull request, run the tests, linter, and formatter. Integration tests install the signed Gatekeeper community extension; the first run needs network access, then DuckDB caches it. The fresh-install smoke test always downloads unless `-short` is used.

```sh
go fmt ./...
go test -race -tags=duckdb_arrow ./...
golangci-lint run
```

### Update Dependencies

Update dependencies with `go get -u` and then run `go mod tidy` to clean up the `go.mod` file.
