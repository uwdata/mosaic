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

Programs embedding `pkg/server` should authenticate with standard HTTP middleware around the handler returned by
`server.New`, then use `server.WithAuthorizer` only for command-aware policy. `AuthorizeRequest` runs once before POST
decoding or WebSocket upgrade and returns a `CommandAuthorizer[T]` called for every decoded command, including each
WebSocket message, before policy validation or execution. If it reads `r.Body`, it must restore it; both
authorizers must be concurrency-safe. Outer middleware must decide whether CORS preflight `OPTIONS` requests may reach
the server.

Omitting `WithAuthorizer` adds no application authorization. A request authorizer that fails or returns a nil command callback fails
closed. `ErrUnauthenticated`, `ErrPermissionDenied`, and `ErrInvalidCommand` map to HTTP 401, 403, and 400; unexpected
errors are logged and returned as sanitized 500 responses. Authorization can allow or deny the normalized command type
and exact SQL, but cannot rewrite SQL or sandbox the shared process, filesystem, network, extensions, catalogs, or
credentials.

`CommandAuthorizer[T]` returns `(*query.ValidationPolicy, error)`: an error denies the command, `nil, nil` adds no request restrictions, and `policy, nil` validates on the execution connection and rejects `exec`. DB-level `query.WithValidation()` applies even when the returned policy is nil.

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
	return func(ctx context.Context, command server.Command[*Fields]) (*query.ValidationPolicy, error) {
		project := getProject
		if fields := command.Payload(); fields != nil {
			project = fields.Project
		}
		if project != "dashboard" || command.Type() == server.CommandExec {
			return nil, server.ErrPermissionDenied
		}
		return nil, nil
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

Gatekeeper is optional. Enable validation with a [Gatekeeper JSON policy](https://github.com/nozzle/duckdb-gatekeeper#json-policy-documents) (requires 0.3.0+):

```sh
duckdb-server-go --gatekeeper='{"version":1,"options":{}}'
```

The CLI loads Gatekeeper (installing from community if needed), passes the document unchanged to `gatekeeper_configure`, disables extension autoload/autoinstall, and locks configuration. `--load-extensions` can provide a local artifact first. Upgrade cached installations with `FORCE INSTALL gatekeeper FROM community`, then restart.

For Go applications, load Gatekeeper during trusted setup and call `query.ConfigureGatekeeper(ctx, execer, document)` before locking configuration. `query.New` does not load extensions; `query.WithValidation()` requires Gatekeeper and enables validation for every Arrow query. `db.Close()` also closes the connector.

Pass `*query.ValidationPolicy` to `QueryArrow` or `WriteArrow`, directly or from `WithAuthorizer`, to narrow the global policy. Use `JSON: &document` or typed `AllowedTables`, `BlockedTables`, `AllowedFunctions`, `BlockedFunctions`, and `UseDefaultFunctions` fields; the two forms cannot be mixed. Nil slices omit options; empty slices remain explicit arrays. `TableRule.Catalog` and `UseDefaultFunctions` are pointers. Names are passed unchanged, including whitespace.

`ValidateSQL(ctx, sql, policy)` returns `(ValidationResult, error)` without executing. `Details` contains diagnostics and violations; successful results include `CallerObjects`, transitive `Objects`, and `Functions`. Use `errors.As` with `query.ErrorDetails`, or `errors.Is` with `ErrValidation`, `ErrAccessDenied`, `ErrUnsupportedStatement`, and `ErrInvalidPolicy`. HTTP/WebSocket validation errors are sanitized: policy denials return 403, SQL errors 400, and invalid application policies or validator failures 500.

Validated execution uses the same connection for validation and execution and rejects `exec`; disable Mosaic pre-aggregation with `preagg: { enabled: false }`. Trusted views/macros can expose their dependencies. See Gatekeeper's [policy schema](https://github.com/nozzle/duckdb-gatekeeper/blob/v0.3.0/docs/policy-v1.schema.json) and [security model](https://github.com/nozzle/duckdb-gatekeeper/blob/v0.3.0/docs/security.md) for policy semantics and resource boundaries.

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
