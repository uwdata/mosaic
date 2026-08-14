# DuckDB Go Server

A Go-based server that runs a local DuckDB instance and support queries over Web Sockets or HTTP/HTTPS, returning data in either [Apache Arrow](https://arrow.apache.org/) or JSON format.

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
-   `--max-cache-entries <size>`: The maximum number of cache entries. Defaults to 1000.
-   `--max-cache-bytes <bytes>`: Max number of cache size in bytes (overrides max-cache-entries if both are set). Defaults to 0 (no limit).
-   `--cache-ttl <duration>`: Time-to-live for cache entries as a Go duration. 0s means no expiration (e.g., '10m', '1h'). Defaults to 0s.
-   `--cert <path>`: Path to a TLS certificate file to enable HTTPS.
-   `--key <path>`: Path to a TLS private key file to enable HTTPS.
-   `--schema-match-headers`: Comma-separated list of headers to match against schema names for multi-tenant access control (e.g., `X-Tenant-Id,verified-user-id`).
-   `--load-extensions`: Comma-separated list of extensions to install and load at startup. Use a pipe after the extension name to specify a DuckDB repository alias. Unspecified repositories use DuckDB's default (e.g. `mysql_scanner,netquack|community,aws|core_nightly`).
-   `--function-blocklist`: Comma-separated list of exact function names to block, useful for blocking functions that may pose security or performance risks (e.g. `bigquery_query,read_parquet`).
-   `--function-allowlist`: Comma-separated list of exact function names to add to the reviewed defaults. Names are matched case-insensitively, repeated flags accumulate names, and an explicitly empty value enables only the defaults.
-   `--function-allowlist-exclude`: Comma-separated list of exact function names to remove from the effective allowlist.
-   `--function-allowlist-defaults`: Whether to include the reviewed defaults. Set this to `false` for an exact-only allowlist.

By default, the server will look for `localhost.pem` and `localhost-key.pem` in the current directory to enable HTTPS if the `--cert` and `--key` flags are not provided.

For compatibility, the installed binary permits all HTTP and WebSocket origins. A cross-site page can therefore submit
commands, including side-effecting `exec` commands over GET, to a running server. Do not expose the binary to untrusted
browsers or cookie credentials without an outer proxy that enforces an origin or CSRF policy. Programs embedding
`pkg/server` instead receive safe zero-value origin defaults and can configure exact allowed origins.

Create certificates for localhost with [mkcert](https://github.com/FiloSottile/mkcert)

```sh
mkcert -install # Install mkcert CA
mkcert localhost # create localhost.pem and localhost-key.pem
```

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
`server.New`, then use `server.WithAuthorizer` only for command-aware policy. `AuthorizeRequest` runs once before POST
decoding or WebSocket upgrade and returns a `CommandAuthorizer` called for every decoded command, including each
WebSocket message, before policy validation, cache lookup, or execution. If it reads `r.Body`, it must restore it; both
authorizers must be concurrency-safe. Outer middleware must decide whether CORS preflight `OPTIONS` requests may reach
the server.

Omitting `WithAuthorizer` preserves unrestricted behavior; a configured authorizer that fails or returns nil fails
closed. `ErrUnauthenticated`, `ErrPermissionDenied`, and `ErrInvalidCommand` map to HTTP 401, 403, and 400; unexpected
errors are logged and returned as sanitized 500 responses. Authorization can allow or deny the normalized command type
and exact SQL, but cannot rewrite SQL or sandbox the shared process, filesystem, network, extensions, catalogs, or
credentials.

### Function Policies

Use an allowlist when the server should accept only reviewed functions and operators. An explicitly empty value enables
the defaults without adding application-specific names:

```sh
duckdb-server-go --function-allowlist=
```

Without an allowlist-related flag, the server remains unrestricted. `--function-allowlist-defaults=false` enables an
exact-only policy; with no included names, it denies every function call.

Programs embedding `pkg/query` can apply the same policy and add application functions with:

```go
query.WithFunctionAllowlist(query.FunctionAllowlistOptions{
	Include: append(functionset.Spatial(), "my_function"),
})
```

The defaults cover ordinary local computation: built-in operators, aggregates, windows, parser syntax helpers, common
side-effect-free scalar functions, and non-I/O table generators. `pkg/functionset` exposes `DefaultFunctions`,
`BuiltinOperators`, `BuiltinAggregates`, `BuiltinWindows`, `BuiltinSyntaxHelpers`, `BuiltinTableGenerators`, and
`CommonScalarFunctions`; each returns a fresh list that can also be appended to `Include` or `Exclude`. These inventories
were reviewed against DuckDB 1.5.5 and must be reviewed when DuckDB is upgraded. Newly introduced and extension-provided
function names are not admitted automatically. The defaults include reviewed fixed-expression macros, such as the
`list_sum` wrapper whose aggregate target is hardcoded; client-controlled dispatch through `list_aggregate` remains
excluded.

`functionset.Spatial()` and `functionset.Parquet()` provide opt-in inventories for the corresponding core extensions; they
are never included in `DefaultFunctions`. These sets include resource-capable readers. They authorize function names
only: they do not load an extension, inspect paths or URIs, or grant filesystem or network access.

For query-only Mosaic geo rendering over geometry data already present in DuckDB, load the spatial extension and add
`--function-allowlist=st_x,st_y,st_centroid,st_asgeojson`. Mosaic's `loadSpatial`/`vg.spatial` loader still uses `ST_Read`
through `Coordinator.exec`, and all `exec` requests are rejected while a function policy is configured.

Current-time function names are intentionally omitted because clients can request persistent results whose cache key is
only the SQL text and output format, with no expiration by default. This does not block keyword forms such as
`CURRENT_DATE` and `CURRENT_TIMESTAMP`, which DuckDB serializes as column references rather than function calls.

`Include` and `Exclude` names are trimmed, deduplicated, and matched exactly and case-insensitively; exclusions take
precedence. Set `DisableDefaults: true` for an exact-only policy. With defaults disabled and no included names, all
function calls are denied. Omitting `WithFunctionAllowlist` preserves unrestricted function behavior. An allowlist and
a non-empty blocklist cannot be combined. Like the blocklist, the allowlist compares only DuckDB's serialized
`function_name`; schema and catalog qualifiers do not affect the match. When schema matching is active, its independent
validator still rejects catalog-qualified function calls.

This is a syntactic policy over the SQL submitted to the server. It does not bind functions, inspect argument meaning,
expand views or macros, recursively authorize SQL strings accepted by `query` or `json_execute_serialized_sql`, or
resolve strings passed to `query_table`. An allowed name can resolve to a built-in, extension function, or same-name macro
in any reachable schema or catalog, so all catalogs, schemas, and the search path must remain trusted and immutable to
query clients. Allowing `read_parquet`, for example, permits the explicit function name for both local and remote
arguments. File replacement scans such as `FROM 'gcs://bucket/data.parquet'` appear as table references rather than
function calls and are not covered by the function policy. To reject these unqualified table references syntactically,
also configure `--schema-match-headers` with trusted schema headers as described in
[Multi-Tenant Access Control](#multi-tenant-access-control).

Views and tables in attached catalogs also serialize as `BASE_TABLE` references, so function validation does not inspect
the scans they resolve to during binding. This can be used deliberately to expose pre-provisioned remote datasets while
leaving `read_parquet`, `iceberg_scan`, and similar reader functions out of the allowlist. Clients can query those table
references but cannot call the excluded readers directly; catalog integrity and the DuckDB process's filesystem and
network access remain the security boundary.

DuckDB does not expose a supported function catalog annotation for path, URI, or SQL-string arguments. As of DuckDB
1.5.5, its [internal extension-prefix table](https://github.com/duckdb/duckdb/blob/v1.5.5/src/include/duckdb/main/extension_entries.hpp#L1277-L1280)
maps `http`, `https`, `s3`, `s3a`, `s3n`, `gcs`, `gs`, `r2`, and `hf` to `httpfs`, while `azure`, `az`, and `abfss` map
to the Azure extension. This list is version-specific and extensions can add other resource mechanisms. Treat it as a
review checklist, not a complete authorization boundary; restrict the DuckDB process's filesystem, credentials, and
network independently.

### Multi-Tenant Access Control

`schema-match-headers` isn't part of the mosaic server API, but is provided here as an example of how to have
multiple users / customers share the same DuckDB server instance while restricting table queries to tenant schemas.

1. **Client side**: Give each tenant a dedicated pre-aggregation schema when constructing and registering its coordinator
   ([docs](https://idl.uw.edu/mosaic/api/core/coordinator.html#constructor)):

   ```js
   const mc = new Coordinator(connector, {
     preagg: { enabled: false, schema: tenantSchema }
   });
   coordinator(mc);
   ```

   The schema name is part of the tenant authorization policy and must not be shared by mutually untrusted tenants. It
   must be one of the schema names supplied by the trusted headers described below. If results should be shared across
   users, use a tenant id or organization id rather than a user id.
2. **Authentication**: This implementation assumes that there is some authentication mechanism in place that sets the
   trusted authentication headers in the request. The server will use these headers to determine which schema
   to use for the query. This might be a server-side cookie sent through with mosaic requests, or a header set on outbound
   requests from the client, which are verified in an api gateway or server middleware before reaching the DuckDB server.
3. **Server side**: Start the server with `--schema-match-headers=X-Tenant-Id,verified-user-id`, or whatever headers
   you trust to match against schema names. Inbound requests will be checked for these headers, and if they are present,
   the server will allow access to any schemas that match the header values. If no headers are present, and `--schema-match-headers`
   is set, the server will return a 401 Unauthorized error.

_Note:_ Schema matching authorizes schema references in submitted SQL; it does not isolate the shared DuckDB process,
filesystem, network, extensions, or credentials. It assumes a single catalog; attached catalogs are outside this policy
boundary, and explicitly catalog-qualified table, `SHOW`, and function references are rejected. Function allowlists and
blocklists apply only to explicit function calls. Schema matching does not restrict catalog metadata returned by functions
such as `duckdb_tables()` and `pragma_table_info()`. If metadata is sensitive, allow or block the exact metadata-function
names exposed by the deployment; wildcard patterns such as `duckdb_*` are not supported, and the policy must be reviewed
when DuckDB or its extensions change. To restrict file-reading functions, also enable schema matching so DuckDB replacement
scans such as `FROM 'data.parquet'` are rejected as unqualified table references. These controls are not a sandbox: run the
server with access only to external resources that are safe for every tenant.

If `--schema-match-headers`, `--function-blocklist`, or `--function-allowlist` is configured, `json` and `arrow` requests
are limited to statements DuckDB can serialize for validation; unsupported forms such as `PRAGMA` and `SET` are rejected,
with HTTP requests receiving a 400 response. All `exec` requests are also rejected until full-statement authorization is
supported. This includes every `Coordinator.exec(...)` call, such as data loading, preloading, and DDL/DML. Mosaic
pre-aggregation also uses `exec` to create schemas and tables, so set `preagg: { enabled: false }` in this mode.

## API

The server supports queries via HTTP GET and POST, and WebSockets. The GET endpoint is useful for debugging. For example, you can query it with [this url](<http://localhost:3000/?query={"sql":"select 1","type":"json"}>).

Each endpoint takes a JSON object with a command in the `type`. The server supports the following commands.

### `exec`

Executes the SQL query in the `sql` field.

### `arrow`

Executes the SQL query in the `sql` field and returns the result in Apache Arrow format.

### `json`

Executes the SQL query in the `sql` field and returns the result in JSON format.

## Developers

### Build

Build the release binary with:

```sh
go build -o duckdb-server-go .
```

### Develop

To run the server, use `go run` (this won't restart when the code changes):

```sh
go run -tags=duckdb_arrow .
```

Before sending a pull request, run the tests, linter, and formatter:

```sh
go fmt ./...
go test -tags=duckdb_arrow ./...
golangci-lint run
```

### Update Dependencies

Update dependencies with `go get -u` and then run `go mod tidy` to clean up the `go.mod` file.
