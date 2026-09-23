# DuckDB Go Server

A Go-based server that runs a local DuckDB instance and support queries over Web Sockets or HTTP/HTTPS, returning data in [Apache Arrow](https://arrow.apache.org/) format.

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
-   `--gatekeeper <json>`: Complete Gatekeeper JSON policy document, passed verbatim to `gatekeeper_configure(json := ...)`. `{"version":1,"options":{}}` enables validation with defaults. May be specified once.

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

Validation uses the signed Gatekeeper community extension's JSON policy API (0.3.0+) on DuckDB 1.5.5. `query.New` neither installs nor loads Gatekeeper; trusted initialization does. When `--gatekeeper` is supplied, the CLI loads an already-installed Gatekeeper or runs `INSTALL gatekeeper FROM community; LOAD gatekeeper`, passes the document to `CALL gatekeeper_configure(json := ...)`, disables `autoload_known_extensions` and `autoinstall_known_extensions`, and sets `lock_configuration=true` before serving. The first community install needs network access and a writable extension directory, and DuckDB does not upgrade a cached extension on its own. Without the flag, the CLI leaves validation disabled.

Upgrade an existing community installation with `FORCE INSTALL gatekeeper FROM community` in DuckDB 1.5.5 using the server's extension directory, then restart the server. Ordinary `INSTALL` and `LOAD` reuse cached artifacts. CI caches extensions to reduce downloads; this is not a version pin. The fresh-install regression logs the downloaded version and checks signed installation and validation startup without requiring a particular release number. Integration tests check the policy behavior Mosaic relies on.

To pin or provide Gatekeeper yourself, install it through `--load-extensions`, which runs before the community fallback: `--load-extensions=gatekeeper|community` for an explicit community install, or `--load-extensions=/path/gatekeeper.duckdb_extension` for a local signed artifact (the filename must be `gatekeeper.duckdb_extension`). Unsigned development builds additionally require `--database=':memory:?allow_unsigned_extensions=true'`, which enables unsigned loading database-wide. Local tests and CI use the signed community artifact with signature checking enabled:

```sh
go test -race -tags=duckdb_arrow ./...
go run -tags=duckdb_arrow . --gatekeeper='{"version":1,"options":{}}'
```

Gatekeeper intersects each request with a database-wide ceiling. Configure it during trusted initialization and lock configuration before serving. `query.ConfigureGatekeeper(ctx, execer, document)` passes JSON text unchanged to Gatekeeper, which owns parsing, duplicate-key detection, document versions, defaults, and validation. Configuration replaces the global policy; request validation can only narrow it.

Per-request `query.ValidationPolicy` accepts either `JSON: &document` for an unchanged complete document or typed fields as a Go convenience. Combining `JSON` with typed options is rejected. Typed fields serialize once to a version-1 policy document; Gatekeeper interprets it. `AllowedTables` and `BlockedTables` contain `query.TableRule{Catalog, Schema, Table}` values. `Catalog` is `*string`: nil omits it, while a pointer preserves the supplied value (including invalid empty strings). An omitted or JSON-null catalog matches any catalog; a whole-component `*` matches any name. Matching is case-insensitive, and other patterns such as `tenant_*` are literal identifiers. Nil `AllowedTables` omits the option; an explicit empty slice denies caller table and view references. Blocks win over allows. The server does not discover or implicitly restrict a default catalog.

`AllowedFunctions` is `allowed_functions` (nil inherits the global allowlist, including global grants; a non-nil slice, even empty, intersects with it), and `BlockedFunctions` adds to the global blocklist. `UseDefaultFunctions` is `*bool`: nil omits the option; a pointer to true or false sends that value. Names are passed unchanged. Gatekeeper matches names case-insensitively but does not trim whitespace: `" md5 "` does not match `md5`, and table-rule components retain their spaces too. Empty and NUL-containing names are rejected. Raw JSON preserves explicit nulls for Gatekeeper to validate rather than converting them to omitted fields or empty arrays.

The same document format works in a per-command policy authorizer, including both function and table restrictions:

```go
document := `{"version":1,"options":{"allowed_tables":[{"schema":"reporting","table":"orders"}],"blocked_functions":["md5"]}}`
return &query.ValidationPolicy{JSON: &document}, nil
```

`db.QueryArrow(ctx, sql, policy)` and `db.WriteArrow(ctx, sql, policy, w)` validate when `policy` is non-nil, or always when `query.WithValidation()` is configured, and then execute on the same pooled connection. `WithValidation()` also disables `db.Exec` and makes `query.New` fail when Gatekeeper is not loaded; without it, a request policy that cannot reach `gatekeeper_validate` fails closed at call time. `db.ValidateSQL(ctx, sql, policy)` validates on any pooled connection without executing.

Use `errors.As` with `query.ErrorDetails` to inspect Gatekeeper's `Code`, `Type`, `Message`, `Position`, and `Violations`; use `errors.Is` with `ErrValidation`, `ErrAccessDenied`, or `ErrUnsupportedStatement` for classification. `Position` is an optional zero-based byte offset (`*int64`). Violations expose rule, catalog/schema/table, function, and optional byte offset; object denials use the `table` rule. Diagnostic text is not a stable API. HTTP/WebSocket validation errors return generic messages while logging full diagnostics for operators. Go callers retain full diagnostics, which may expose private catalog names and paths.

`db.InspectSQL(ctx, sql, policy)` returns a `ValidationResult` and an error on denial or validation failure. `result.Details` contains the decision code and diagnostics; the result itself is not an error. On success, `CallerObjects` lists caller-attributable catalog tables/views; `Objects` also includes trusted dependencies, and `Functions` records resolved functions. These evidence lists are empty on denial; the rejected table identities are in `result.Details.Violations`. `InspectSQL` does not execute or reserve its connection. Result columns and nested structs are scanned directly, without a SQL JSON conversion.

An invalid policy returned by an application authorizer is a server error: `errors.Is(err, query.ErrInvalidPolicy)` identifies it, HTTP/WebSocket responses are generic 500/internal_error, and operators receive an Error-level log. Gatekeeper 0.3 uses `invalid_input` for both policy errors and empty SQL, so on that result Mosaic checks the same policy with `SELECT 1` to distinguish them without parsing SQL or policy diagnostics. Empty/comment-only SQL with a valid policy remains a 400. Both raw JSON and typed policy fields can contain invalid values.

For example, an embedding application grants CSV access once in the connector's initialization callback:

```sql
INSTALL gatekeeper FROM community;
LOAD gatekeeper;
CALL gatekeeper_configure(allowed_functions := ['read_csv']);
SET autoload_known_extensions=false;
SET autoinstall_known_extensions=false;
SET lock_configuration=true;
```

Then constructs the query DB on the same connector and scopes tables per request:

```go
db, err := query.New(ctx, connector, query.WithValidation())
// ...
catalog := "analytics"
data, err := db.QueryArrow(ctx, sql, &query.ValidationPolicy{
	AllowedTables: []query.TableRule{{Catalog: &catalog, Schema: tenant, Table: "orders"}},
	BlockedTables: []query.TableRule{{Catalog: &catalog, Schema: tenant, Table: "secrets"}},
})
```

Check each initialization error before proceeding. `db.Close` closes the pool and, because `database/sql` closes connectors that implement `io.Closer`, the DuckDB database behind the connector; a later `connector.Close` is a no-op.

Programs embedding `pkg/server` should authenticate with standard HTTP middleware around the handler returned by
`server.New`, then use `server.WithAuthorizer` only for command-aware policy. `AuthorizeRequest` runs once before POST
decoding or WebSocket upgrade and returns a `CommandAuthorizer[T]` called for every decoded command, including each
WebSocket message, before policy validation or execution. If it reads `r.Body`, it must restore it; both
authorizers must be concurrency-safe. Outer middleware must decide whether CORS preflight `OPTIONS` requests may reach
the server.

Omitting `WithAuthorizer` preserves unrestricted behavior; a configured authorizer that fails or returns nil fails
closed. `ErrUnauthenticated`, `ErrPermissionDenied`, and `ErrInvalidCommand` map to HTTP 401, 403, and 400; unexpected
errors are logged and returned as sanitized 500 responses. Authorization can allow or deny the normalized command type
and exact SQL, but cannot rewrite SQL or sandbox the shared process, filesystem, network, extensions, catalogs, or
credentials.

`server.WithPolicyAuthorizer` lets an application's `CommandPolicyAuthorizer[T]` return a per-command `*query.ValidationPolicy` from `(context.Context, Command[T])`. Authenticate in `AuthorizeRequest`, then derive restrictions from trusted identity and the decoded payload. The returned policy is applied on the connection that executes the command. A non-nil policy rejects `exec`; nil leaves the command unvalidated unless the DB was built with `query.WithValidation()`.

### HTTP Response Caching

Configure caching and request-header variation independently:

```go
handler, err := server.New(db,
	server.WithCacheControl("private, max-age=60"),
	server.WithVary("X-Tenant-Id"),
)
```

`WithCacheControl(value)` sets the complete header value on successful GET `arrow` responses. The application chooses storage, sharing, and freshness directives, such as `no-store`, `private, max-age=60`, or `public, max-age=60, s-maxage=300`. An omitted or empty value preserves existing behavior, including any headers set by outer middleware. Configured values replace an existing Cache-Control header; other responses, including errors, `exec`, POST, OPTIONS, and WebSocket handshakes, receive `no-store`. HEAD is unsupported and returns `405`; only GET query responses are cacheable.

For GET `arrow` responses, enabling Cache-Control also generates a strong ETag from the response format and serialized bytes. A matching `If-None-Match` returns `304` with no body and the applicable Cache-Control, ETag, and Vary headers. Tag lists, weak comparisons, and `*` are supported. `If-Match` uses strong comparison and takes precedence, returning `412` without an ETag on a mismatch. Other command types and methods, including `exec` and POST, ignore conditional request headers; `If-Match` cannot guard an `exec` command. Authorization, query validation, execution, serialization, and hashing of the complete response still run before evaluating validators: revalidation saves transfer bandwidth. Changes to data do not invalidate already-fresh HTTP cache entries before their configured lifetime expires. Middleware or proxies that compress or transform the response must update or weaken its strong ETag.

`WithVary(headers ...string)` accepts individual names or a slice with `headers...`. Names are copied, trimmed, canonicalized, and deduplicated; `*` is accepted. They append to existing Vary values, including CORS fields, on every response. `WithVary()` configures no additional names. Each option replaces earlier configuration of the same option. Invalid header characters are rejected during server construction; Cache-Control directives are otherwise passed through.

Applications must explicitly configure headers affecting authorization or results using `WithVary` / `--vary`.

Caches must include the complete GET query string, including `type` and `sql`, and distinguish all Vary headers. Vary partitions cache entries; it does not authorize requests. Shared caches serving protected data must enforce access control before cache lookup. HTTP caching is separate from the coordinator's application cache.

The equivalent command-line settings are:

```sh
duckdb-server-go --cache-control='private, max-age=60' --vary=X-Tenant-Id
```

### Application Command Fields

Application fields can be siblings of `type` and `sql` or nested, for example under `meta`. Mosaic defines no metadata schema. Choose the complete envelope's Go type with `Authorizer[T]` or `AuthorizerFunc[T]`; `command.Payload()` returns it. `WithAuthorizer` infers `T`, while `New` stays non-generic.

For example, an application can limit commands to its `dashboard` project, with GET parameters as a fallback:

```go
type Fields struct {
	Project string `json:"project"`
}

authorizer := server.AuthorizerFunc[*Fields](func(r *http.Request) (server.CommandAuthorizer[*Fields], error) {
	getProject := r.URL.Query().Get("project")
	return func(ctx context.Context, command server.Command[*Fields]) error {
		project := getProject
		if fields := command.Payload(); fields != nil {
			project = fields.Project
		}
		if project != "dashboard" || command.Type() == server.CommandExec {
			return server.ErrPermissionDenied
		}
		return nil
	}, nil
})

handler, err := server.New(db,
	server.WithAuthorizer(authorizer),
	server.WithMaxMessageBytes(1<<20),
)
```

Each POST or WebSocket command decodes into a fresh `T` using `encoding/json`. `Payload()` returns that value without copying; mutations cannot change the authoritative `Type()` or `SQL()`. Custom decoders are responsible for their own sharing and must account for protocol keys (`type`, `sql`, `name`) when rejecting unknown fields.

Use structs, maps, or custom `UnmarshalJSON` implementations as needed. `json.RawMessage` preserves JSON value bytes, not surrounding whitespace. If no application fields are needed, `struct{}` skips application decoding; existing authorizers can migrate to `AuthorizerFunc[struct{}]`, `CommandAuthorizer[struct{}]`, and `Command[struct{}]`.

GET skips JSON decoding and supplies the zero value of `T` (`nil` for pointers); capture query parameters in `AuthorizeRequest`. Payload decoding failures reject the command before command authorization with HTTP 400 or a recoverable WebSocket `bad_request`, and log a warning without payload values.

Application fields are untrusted: combine them with authenticated identity, as shown in the compiled [`ExampleNew`](pkg/server/example_test.go). Client caching can bypass the connector, and consolidation can discard query options. If fields affect results or access, isolate coordinator/cache/consolidation state per scope or disable that reuse.

`WithMaxMessageBytes(n)` requires a positive byte limit for entire POST bodies and decompressed WebSocket messages, applied after request authorization and before decoding. Defaults are unbounded POST bodies and 32 KiB WebSocket messages. Exceeding the limit returns HTTP 413 or closes the WebSocket with code 1009. Request authorizers reading the body must enforce their own limits and restore it.

POST and WebSocket messages require one complete command object with optional surrounding whitespace; trailing data is rejected. Protocol decoding failures return HTTP 400 or close the WebSocket with code 1007. Validation and authorization errors leave a healthy WebSocket session open.

### Gatekeeper Configuration

Enable the default policy:

```sh
duckdb-server-go --gatekeeper='{"version":1,"options":{}}'
```

Gatekeeper requires `version: 1` and an `options` object. The version is the policy-document format, not the extension release. Option names match Gatekeeper's named options: `allowed_tables`, `blocked_tables`, `allowed_functions`, `blocked_functions`, and `use_default_functions`. Omitted options use Gatekeeper's configuration defaults. An empty `allowed_tables` list denies caller table/view access; `use_default_functions: false` allows only explicitly admitted functions. Blocks win over allows. See the [policy authoring schema](https://github.com/nozzle/duckdb-gatekeeper/blob/v0.3.0/docs/policy-v1.schema.json).

```sh
duckdb-server-go --gatekeeper='{
 "version": 1,
 "options": {
  "allowed_tables": [{"catalog":"analytics","schema":"reporting","table":"*"}],
  "blocked_tables": [{"catalog":"analytics","schema":"reporting","table":"secrets"}],
  "allowed_functions": ["sum","count_star"],
  "blocked_functions": ["md5"],
  "use_default_functions": false
 }
}'
```

The CLI rejects repeated flags and otherwise passes the exact document to Gatekeeper without parsing or rebuilding it. Gatekeeper rejects malformed JSON, duplicate keys, unknown options, unsupported versions, wrong types, and invalid nulls during initialization, before the server listens. Table rules require `schema` and `table`; omitted or null `catalog` matches any catalog. `{}` alone is not a valid document. The flag configures the global ceiling and enables validation for every `arrow` request.

Programs embedding `pkg/query` configure functions the same way, through `CALL gatekeeper_configure(...)` in trusted initialization, and narrow per request with `query.ValidationPolicy`:

```go
db.QueryArrow(ctx, sql, &query.ValidationPolicy{
	AllowedTables:    []query.TableRule{{Schema: tenant, Table: "*"}},
	BlockedFunctions: []string{"my_expensive_function"},
})
```

Gatekeeper maintains the reviewed default function inventory. Additional functions must be granted in the global ceiling; a request that names `AllowedFunctions` intersects with that ceiling and cannot widen it, while a request that leaves `AllowedFunctions` nil inherits it. Set `UseDefaultFunctions` to a pointer to false for an exact-only policy.

Gatekeeper validates supported read syntax and binds objects. Function admission remains name-based. Since 0.2.0, trusted view, macro, and attached-table dependencies are exempt from table and function policies, including blocks and the never-bind list. Caller references beside those definitions still obey policy. Gatekeeper's policy, enforcement, and logging controls remain forbidden on every route. Defaults deny caller file readers and replacement scans; admitting a reader in the global ceiling permits its resource access, and table rules do not restrict reader paths. Caller-written dynamic SQL and metadata readers cannot be admitted, but a trusted definition may expose them. Keep definitions trusted and enforce filesystem/network access independently.

Spatial compute defaults cover Mosaic rendering over existing geometry data, but the `ST_Read` loader requires explicit admission. Gatekeeper defaults include clock and connection-local random functions such as `now`, `current_date`, and `random`; account for those when caching results.

### Multi-Tenant Access Control

Applications embedding `pkg/server` use `WithPolicyAuthorizer` to derive per-command table rules from authenticated identity. The CLI's global policy applies equally to every caller. Explicit catalog/schema/table rules can restrict tenants; the same schema name in another catalog matches if the catalog is omitted. An allowed view can expose underlying tables in other schemas, including another tenant's, so only trusted setup should create definitions. Isolate client coordinator/cache state by tenant and disable pre-aggregation in validated mode.

Schema-wide `SHOW TABLES FROM tenant_a` is denied under table restrictions. `DESCRIBE SELECT 1` remains supported. Missing objects fail binding rather than receiving syntax-only authorization. Gatekeeper limits requests to one supported read statement. HTTP denials return 403; parser, binding, and unsupported results return 400. Binding can perform I/O, and concurrent catalog changes between validation and execution remain a race; see Gatekeeper's [security model](https://github.com/nozzle/duckdb-gatekeeper/blob/v0.3.0/docs/security.md).

Mosaic uses `gatekeeper_validate` with per-request policies before executing on the same connection. It does not enable permanent `gatekeeper_enforce()` mode, which applies the global policy without per-request narrowing.

If `--gatekeeper` is configured, `arrow` requests
are limited to supported read statements; unsupported forms such as `PRAGMA` and `SET` are rejected,
with HTTP requests receiving a 400 response. All `exec` requests are also rejected until full-statement authorization is
supported. This includes every `Coordinator.exec(...)` call, such as data loading, preloading, and DDL/DML. Mosaic
pre-aggregation also uses `exec` to create schemas and tables, so set `preagg: { enabled: false }` in this mode.

## API

The server supports queries via HTTP GET and POST, and WebSockets. GET uses `type` and `sql` query parameters, for example [this URL](<http://localhost:3000/?type=arrow&sql=select%201>).

POST and WebSocket requests take a JSON object with the command in `type` and query text in `sql`. The server supports the following commands.

### `exec`

Executes the SQL query in the `sql` field.

### `arrow`

Executes the SQL query in the `sql` field and returns the result in Apache Arrow format.

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

Before sending a pull request, run the tests, linter, and formatter:

```sh
go fmt ./...
go test -tags=duckdb_arrow ./...
golangci-lint run
```

### Update Dependencies

Update dependencies with `go get -u` and then run `go mod tidy` to clean up the `go.mod` file.
