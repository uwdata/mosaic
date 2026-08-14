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

Without `--function-allowlist`, the server remains unrestricted. The binary intentionally exposes only policy
activation and exact additions; use `pkg/query` for exclusions, exact-only policies, or extension groups.

Programs embedding `pkg/query` can apply the same policy and add application functions with:

```go
query.WithFunctionAllowlist(query.FunctionAllowlistOptions{
	Include: append(functionset.Spatial.Elevated(), "my_function"),
})
```

By default, configured policies use `functionset.DefaultFunctions()`, which contains reviewed built-ins and every
[core extension](https://duckdb.org/docs/current/core_extensions/overview)'s `Compute()` group. `Elevated()` requires
explicit admission, and `All()` returns both groups. These Go helpers return fresh slices; the CLI accepts exact names only.

The table records unique names reviewed against DuckDB 1.5.5. A name is elevated if any overload has elevated behavior.
An empty row means the extension has no reviewed function-call names, not that it has no other capabilities.

| Extension | Compute | Elevated | Classification and status |
| --- | ---: | ---: | --- |
| `Autocomplete` | 1 | 3 | Parser check; completion and parser controls are elevated. |
| `Avro` | 0 | 1 | Reader only. |
| `AWS` | 0 | 1 | Credential and provider operation. |
| `Azure` | 0 | 0 | Filesystem integration with no reviewed function-call names. |
| `Delta` | 2 | 9 | Local parser/test helpers; scans, metadata I/O, and writes are elevated. |
| `DuckLake` | 1 | 21 | Local hash helper; catalog, scan, metadata, and mutation operations are elevated. |
| `Encodings` | 0 | 0 | CSV codec integration with no reviewed function-call names. |
| `Excel` | 2 | 1 | Value conversion; the sheet reader is elevated. |
| `FTS` | 1 | 2 | Text stemming; index creation and mutation are elevated. |
| `HTTPFS` | 0 | 0 | Filesystem integration with no reviewed function-call names. |
| `Iceberg` | 2 | 14 | Value helpers; scans, catalogs, metadata I/O, and writes are elevated. |
| `ICU` | 179 | 7 | Deterministic collation and calendar computation; current-time names are elevated. |
| `Inet` | 11 | 0 | IP value operations only. |
| `JSON` | 33 | 9 | Value parsing and serialization; readers, SQL execution, and plan inspection are elevated. |
| `Lance` | 0 | 12 | Source-pinned scans and metadata operations. |
| `MotherDuck` | 0 | 198 | Best-effort observed proprietary runtime snapshot; all names are elevated. |
| `MySQL` | 0 | 5 | Connector and scanner operations. |
| `ODBC` | 0 | 11 | Connector and scanner operations. |
| `Parquet` | 2 | 9 | `VARIANT` conversion; file, metadata, bloom, and key operations are elevated. |
| `Postgres` | 2 | 8 | Value helpers; connector and scanner operations are elevated. |
| `Quack` | 3 | 9 | Protocol value helpers; remote and session operations are elevated. |
| `Spatial` | 151 | 13 | Geometry computation; readers, index/catalog access, random generation, and resource-capable transforms are elevated. |
| `SQLite` | 0 | 3 | Connector and scanner operations. |
| `TPCDS` | 2 | 2 | Query and answer text; data generators are elevated. |
| `TPCH` | 2 | 2 | Query and answer text; data generators are elevated. |
| `UI` | 0 | 4 | HTTP server lifecycle and status operations. |
| `UnityCatalog` | 0 | 4 | Attached-catalog and checkpoint operations; the generated registry is incomplete. |
| `Vortex` | 0 | 2 | Readers verified against the pinned nested source revision. |
| `VSS` | 0 | 5 | Index access and management operations. |

These groups authorize names only; extension loading and file or network access are separate concerns. Validation is
syntactic and name-only: it does not bind function identity, inspect arguments, expand macros or views, recursively inspect
SQL strings, or cover replacement scans and attached-table binding. Keep catalogs and the search path trusted, and enforce
resource access outside this policy.

In Go, `Exclude` wins over `Include`, and `DisableDefaults` creates an exact-only policy. Omitting
`WithFunctionAllowlist` is unrestricted; configuring an exact-empty policy denies all function calls. A function
allowlist cannot be combined with a non-empty blocklist, and any configured function policy rejects `exec` requests.

Spatial compute defaults cover Mosaic rendering over existing geometry data, but the `ST_Read` loader remains elevated.
Current-time functions are omitted from defaults because persistent cache entries do not expire by default; keyword forms
such as `CURRENT_DATE` are not function nodes and remain outside this policy.

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
