# DuckDB Go Server

A Go-based server that runs a local DuckDB instance and support queries over Web Sockets or HTTP/HTTPS, returning data in either [Apache Arrow](https://arrow.apache.org/) or JSON format.

_Note:_ This package provides a local DuckDB server. To instead use DuckDB-WASM in the browser, use the `wasmConnector` in the [`mosaic-core`](https://github.com/uwdata/mosaic/tree/main/packages/mosaic/mosaic-core) package.

## Startup

Startup completes before the server accepts requests. Bootstrap and external-access finalization run once per connector,
while the connection initializer runs for the initial verification connection and every physical connection opened later
by the query pools.

![DuckDB Go server startup](docs/duckdb-go-server-startup.svg)

[Archify startup source](docs/server-startup.dataflow.json)

The bootstrap initializer receives the initial connection before global settings and optional external-access finalization.
It can install or load extensions, attach reviewed local or remote catalogs, and perform other one-time catalog setup.

## Request Authorization

Request authorization runs once per HTTP request or WebSocket session and provides the command authorizer used for each
decoded command. Configured schema, function, and remote-URI SQL policies use DuckDB's parser and run before cache lookup;
active query policies reject `exec` commands. The command-line server permits all origins and request identities by default;
embedders can supply stricter hooks.

![DuckDB Go server request authorization](docs/duckdb-go-server-request-authorization.svg)

[Archify request source](docs/request-authorization.sequence.json)

Parser-backed validation may open a physical SQL connection. Every new SQL or Arrow connection follows the connector
callback and connection-initializer sequence shown in the startup diagram.

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

### Programmatic Connector Startup

Use `pkg/connector` to complete trusted DuckDB initialization before constructing `pkg/query` or accepting requests.
For an unlocked connector, `WithBootstrapInitializer` can install and load extensions with the existing extension
specification syntax:

```go
duckdbConnector, err := connector.Open(
	ctx,
	":memory:",
	connector.WithBootstrapInitializer(func(ctx context.Context, execer driver.ExecerContext) error {
		return extensions.ParseAndInstall(ctx, execer, "httpfs", "netquack|community")
	}),
)
```

For a locked connector, provision trusted extensions separately and load them before external access is disabled:

```go
duckdbConnector, err := connector.Open(
	ctx,
	"/srv/mosaic/catalog.duckdb",
	connector.WithBootstrapInitializer(func(ctx context.Context, execer driver.ExecerContext) error {
		return extensions.LoadInstalled(ctx, execer, "spatial")
	}),
	connector.WithAllowedDirectories("/srv/mosaic/datasets"),
)
```

`WithBootstrapInitializer` runs exactly once before external access is disabled and the configuration is locked. `Open`
eagerly creates and closes an initial physical connection, so bootstrap or external-access finalization failures are
returned before the connector can reach the query or server layers. `WithConnectionInitializer` instead runs after
bootstrap and external-access finalization for every physical connection; it can perform only operations permitted by the
locked configuration.

Common database-wide resource settings have typed options:

```go
duckdbConnector, err := connector.Open(
	ctx,
	"/srv/mosaic/catalog.duckdb",
	connector.WithMemoryLimit("8GB"),
	connector.WithThreads(8),
	connector.WithTempDirectory("/srv/mosaic/spill"),
	connector.WithMaxTempDirectorySize("64GB"),
	connector.WithExternalFileCache(),
	connector.WithParquetMetadataCache(),
	connector.WithAllowedDirectories("/srv/mosaic/datasets"),
)
```

`WithMemoryLimit` bounds DuckDB's buffer manager, not the Go process or Mosaic's encoded Arrow and JSON result cache.
`WithThreads` sets the database-wide worker count shared by concurrent queries. Configure both together with the query
connection-pool size. `WithMaxTempDirectorySize` has an effect only when a temporary directory is configured.

`WithSetting(name, value)` covers other mutable global settings. It runs once after bootstrap, so extension-defined
settings work when the bootstrap initializer loads the extension first, and before locking when a locked external-access
option is present. Names are SQL identifiers and values are passed as strings for DuckDB to cast. All setting options,
including the typed options above, are applied in the order supplied. Callers can therefore control precedence across
repeated names or DuckDB aliases. For example, a remote catalog deployment can configure `httpfs` without placing
credentials in the DSN:

```go
duckdbConnector, err := connector.Open(
	ctx,
	":memory:",
	connector.WithBootstrapInitializer(func(ctx context.Context, execer driver.ExecerContext) error {
		for _, name := range []string{"httpfs", "iceberg"} {
			if err := extensions.LoadInstalled(ctx, execer, name); err != nil {
				return err
			}
		}
		// Create scoped secrets and ATTACH reviewed Iceberg or DuckLake catalogs here.
		return nil
	}),
	connector.WithSetting("http_timeout", "30"),
	connector.WithSetting("http_retries", "5"),
	connector.WithSetting("http_retry_wait_ms", "200"),
)
```

Core startup settings may still be supplied in the DuckDB DSN, but the connector does not define their application order.
Prefer ordered setting options for mutable configuration and extension-defined settings that become available during
bootstrap.

Locked mode supplies security defaults through the DSN for database opening, before initialization callbacks run.
Conflicting caller DSN values can still affect database opening and trusted bootstrap. Finalization reapplies the security
restrictions after bootstrap and caller setting options, then locks configuration; if DuckDB refuses a required change,
startup fails rather than returning a partially restricted connector.

Use one live connector per file-backed database path in a process and share it across query pools. DuckDB caches the
database instance by path, so opening a second connector while the first remains live encounters its existing
configuration lock. Bootstrap can attach reviewed local or remote databases before external access is disabled; those
catalogs remain usable afterward under any of the locked external-access options, while ungranted external access and `ATTACH`
operations are blocked. A local `ATTACH` permanently grants that database file and its exact `.wal`, `.wal.checkpoint`, and
`.wal.recovery` sidecars for the life of the connector. `DETACH` does not revoke those paths, and any SQL function admitted
by the query layer may read them.

Repository suffixes accepted by `ParseAndInstall` are DuckDB aliases. Use `InstallAndLoadFromCustomRepository` for
repository URLs or paths, and `LoadInstalled`, `LoadFile`, or `InstallAndLoadFile` for provisioned extensions. Installing
at process startup may require network and filesystem access, so production locked deployments should normally provision
extensions in their image and call `LoadInstalled` or `LoadFile`. With the default locked-mode startup settings, DuckDB checks
every extension binary when it is loaded and accepts only core-signed extensions during bootstrap. A plugin
that requires ongoing external I/O is incompatible with the locked mode unless all of its I/O fits the configured grants and
DuckDB filesystem policy. Extensions are trusted native code with the server process's privileges and can bypass DuckDB's
abstractions, so load only trusted repositories and files.

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

### DuckDB External Access

`pkg/connector` exposes locked external access through three capability options. Omitting all three preserves DuckDB's
current access and locking defaults for trusted and backwards-compatible deployments.

| Option | DuckDB resources | Extension behavior |
| --- | --- | --- |
| `WithCatalogOnly()` | Disables external access outside DuckDB's primary and bootstrap-attached database internals. | Disables automatic installation and loading. |
| `WithAllowedDirectories(...)` | Applies the same restrictions and adds local directory-tree or remote URL-prefix grants. | Same as `WithCatalogOnly()`. |
| `WithAllowedPaths(...)` | Applies the same restrictions and adds exact local or remote path grants. | Same as `WithCatalogOnly()`. |

External access, extension installation and autoloading, secret exposure, filesystem grants, configuration-lock
exceptions, and the final lock are configured by these options. Repeated allowed-path or allowed-directory options append
their values. Combining `WithCatalogOnly()` with either grant option is legal but redundant because each grant option
already enables the same locked mode.

Directory and path values are passed directly to DuckDB's `allowed_directories` and `allowed_paths` settings. Blank values
are not treated specially by the connector; DuckDB resolves an empty directory grant to the process working directory.
The connector does not normalize, resolve, or require values to exist; DuckDB interprets them while opening the connector.
Values are DuckDB filesystem prefixes or paths, so a matching extension loaded during bootstrap can grant a specific HTTPS,
S3, or other remote URL prefix while leaving other remote and local resources blocked. A local directory grants read and
write access throughout that tree, including `COPY` and `ATTACH`; an exact local path is also a read/write capability, not a
read-only grant. Use server-owned roots that other processes cannot mutate. DuckDB's in-process settings cannot eliminate
filesystem races involving later symlink, mount, or path changes; use operating-system or container isolation for that
boundary.

All three options apply DuckDB's [security settings](https://duckdb.org/docs/lts/operations_manual/securing_duckdb/overview)
to disable external access, automatic extension installation and loading, community, unsigned, and metadata-mismatched
extensions, persistent-secret storage, and unredacted secret output. They leave no configuration-lock exceptions and lock
the resulting settings before the query layer starts. By default they also disable temporary-file spilling and the
external-file cache. `WithSetting` or the corresponding typed option can enable those performance capabilities before the
final lock.

`WithTempDirectory` is also a filesystem capability: when external access is disabled, DuckDB automatically adds the
temporary directory to `allowed_directories`. SQL can therefore read and write arbitrary files in that tree, not only
DuckDB spill blocks. Use a dedicated process-private directory. Without an explicit temporary directory, memory-heavy
queries fail rather than spill. `WithExternalFileCache` retains external file ranges in memory; DuckDB 1.5.5 does not spill
that cache to disk. `WithParquetMetadataCache` separately retains parsed Parquet metadata. Both help repeated scans of
allowed remote files, but neither is Mosaic's encoded result cache.

With the bundled DuckDB 1.5.5, the implicit grant for a file-backed primary database and every database attached by a
`WithBootstrapInitializer` consists of the database file and the exact sidecar paths `<database>.wal`,
`<database>.wal.checkpoint`, and `<database>.wal.recovery`; it does not include the containing directory. These attachment
grants persist after `DETACH`, and the allowed-path options separately add their configured grants. SQL functions such as
`read_blob` may therefore read the implicitly granted files when they exist. Combine locked external access with a function
allowlist when that distinction matters. These options do not add authentication, origin checks, per-user isolation,
SQL-function policy, CPU and memory limits, or application-level query timeouts. Treat accepted SQL like code running with
the server process's privileges: run as a non-root user with minimal filesystem permissions and network access, and use
process or container resource limits.

### Function Policies

Use an allowlist when the server should accept only reviewed functions and operators. An explicitly empty value enables
the defaults without adding application-specific names:

```sh
duckdb-server-go --function-allowlist=
```

Without `--function-allowlist`, the server remains unrestricted. The binary intentionally exposes only policy
activation and exact additions; use a custom binary embedding `pkg/query` for exclusions, exact-only policies, or
extension groups.

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
| `UI` | 0 | 5 | HTTP server lifecycle, URL, and status operations. |
| `UnityCatalog` | 0 | 4 | Attached-catalog and checkpoint operations; the generated registry is incomplete. |
| `Vortex` | 0 | 2 | Readers verified against the pinned nested source revision. |
| `VSS` | 0 | 5 | Index access and management operations. |

These groups authorize names only; extension loading and file or network access are separate concerns. Function-policy
validation is syntactic and name-only: it does not bind function identity, inspect arguments, expand macros or views,
recursively inspect SQL strings, or cover replacement scans and attached-table binding. Keep catalogs and the search path
trusted, and enforce resource access outside this policy. Pre-provisioned views and attached tables can deliberately expose
curated datasets while reader functions remain excluded; catalog integrity and process resource controls then carry the
boundary.

In Go, `Exclude` wins over `Include`, and `DisableDefaults` creates an exact-only policy. Omitting
`WithFunctionAllowlist` is unrestricted; configuring an exact-empty policy denies all function calls. A function
allowlist cannot be combined with a non-empty blocklist, and any configured function policy rejects `exec` requests.

Spatial compute defaults cover Mosaic rendering over existing geometry data, but the `ST_Read` loader remains elevated.
Current-time functions are omitted from defaults because persistent cache entries do not expire by default; keyword forms
such as `CURRENT_DATE` are not function nodes and remain outside this policy.

### Remote URI Literal Policy

Programs embedding `pkg/query` can make a best-effort to reject caller-supplied remote file locations while keeping local
file readers enabled:

```go
db, err := query.New(ctx, connector,
	query.WithRemoteURILiteralRejection(),
)
```

The option rejects recognized remote URI literals in DuckDB replacement scans, such as
`FROM 'gcs://bucket/file.parquet'`, and in the reviewed positional and named path arguments of
[remote-read-capable functions](./pkg/functionset/remoteread/README.md). It also
checks literal lists and every decoded string literal within a path expression, so
`read_parquet('gcs://' || 'bucket/file.parquet')` is rejected. Only reviewed path arguments are checked; unrelated values
such as `WHERE url = 'https://example.com'` remain unaffected. Ordinary local paths without a recognized marker remain
usable; a local path string containing one of the markers is intentionally rejected.

Matching is case-insensitive and rejects a literal if it contains any prefix reviewed against DuckDB 1.5.5's pinned
[HTTP](https://github.com/duckdb/duckdb-httpfs/blob/827222fb45a043a7a852d1f7aae46901492a3cda/src/httpfs.cpp#L808-L810),
[S3-compatible](https://github.com/duckdb/duckdb-httpfs/blob/827222fb45a043a7a852d1f7aae46901492a3cda/src/s3fs.cpp#L843-L848),
[Hugging Face](https://github.com/duckdb/duckdb-httpfs/blob/827222fb45a043a7a852d1f7aae46901492a3cda/src/include/hffs.hpp#L33-L35),
[Azure Blob](https://github.com/duckdb/duckdb-azure/blob/003214c96d0caa39d5c3e27a9e1976a0692c7d37/src/azure_blob_filesystem.cpp#L32-L36),
and [Azure DFS](https://github.com/duckdb/duckdb-azure/blob/003214c96d0caa39d5c3e27a9e1976a0692c7d37/src/azure_dfs_filesystem.cpp#L27-L34)
filesystem handlers:

```text
http://  https://  s3://  s3a://  s3n://  gcs://
gs://    r2://     hf://  azure://  az://   abfs://  abfss://
```

DuckDB's generated
[extension-prefix map](https://github.com/duckdb/duckdb/blob/v1.5.5/src/include/duckdb/main/extension_entries.hpp#L1275-L1280)
is a useful autoloading cross-check, but it is not exhaustive: the pinned Azure DFS filesystem also accepts `abfs://`.

Trusted initialization can still load filesystem extensions and attach remote Iceberg or other catalogs before accepting
queries. Queries against those attached catalogs use catalog and table identifiers rather than caller-supplied URI
literals, so they remain usable. Enabling this policy rejects all `exec` commands and rejects the known nested-SQL
binders and executors `query`, `json_execute_serialized_sql`, and `json_serialize_plan` outright. `json` and `arrow`
requests are limited to statements DuckDB can serialize for validation. Connector initialization is outside that command
path.

DuckDB's serialized AST does not distinguish a replacement-scan string from a quoted table or CTE identifier, so a
URI-shaped identifier is rejected too.

This is intentionally incomplete hardening against common accidental or opportunistic remote scans, not a filesystem or
network sandbox. Split or otherwise computed path values can evade detection when no individual literal contains a
complete reviewed prefix, as in `'gc' || 's://bucket/file.parquet'`. Macros and views are not expanded, and unreviewed
extensions can define other nested-SQL executors, reader functions, or schemes. Other known gaps include GDAL virtual
paths such as `/vsis3/`, local Iceberg or Delta metadata that refers to remote files, and SQL stored in a local SQLite
view. Keep catalogs, extensions, and initialization SQL trusted, and restrict the server process's filesystem, network,
and credentials independently.

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
