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
-   `--load-extensions`: Comma-separated list of extensions to install and load at startup. Use a pipe after the extension name to specify the repository. Unspecified repositories will default to 'core'. (e.g. `mysql_scanner,netquack|community,aws|core_nightly`
-   `--function-blocklist`: Comma-separated list of functions to block, useful for blocking functions that may pose security or performance risks. (e.g., 'bigquery_query,read_parquet')`

By default, the server will look for `localhost.pem` and `localhost-key.pem` in the current directory to enable HTTPS if the `--cert` and `--key` flags are not provided.

Create certificates for localhost with [mkcert](https://github.com/FiloSottile/mkcert)

```sh
mkcert -install # Install mkcert CA
mkcert localhost # create localhost.pem and localhost-key.pem
```

### Programmatic Extension Initialization

The `pkg/extension` package accepts the same extension strings as `--load-extensions`, while keeping flag parsing and
logging out of the reusable API:

```go
import (
	"context"
	"database/sql"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extension"
)

func openDB(connectorCtx context.Context) (*sql.DB, error) {
	specs, err := extension.Parse(
		"httpfs",
		"netquack|community",
		"aws|core_nightly",
	)
	if err != nil {
		return nil, err
	}

	initializer, err := extension.NewInitializer(connectorCtx, specs...)
	if err != nil {
		return nil, err
	}

	connector, err := duckdb.NewConnector(":memory:", initializer)
	if err != nil {
		return nil, err
	}

	db := sql.OpenDB(connector)
	if err := db.PingContext(connectorCtx); err != nil {
		_ = db.Close()
		return nil, err
	}
	return db, nil
}
```

`duckdb.NewConnector` is lazy: creating it does not invoke the initializer. `PingContext`, the first query, or an
explicit `Connect` forces the first physical connection and therefore verifies extension initialization before the
application reports itself ready. The initializer context is reused for every connection, so it must be a long-lived
connector-lifetime context rather than a request context.

Structured specs also support extensions that are already installed and standalone extension files:

```go
specs := []extension.Spec{
	extension.LoadInstalled("httpfs"),
	extension.InstallAndLoad("custom_scanner", extension.Repository("/srv/duckdb/repository")),
	extension.LoadFile("/opt/duckdb/custom_reader.duckdb_extension"),
	extension.InstallAndLoadFile("/opt/duckdb/custom_writer.duckdb_extension"),
	extension.InstallAndLoad("netquack", extension.Community),
}
```

A custom repository path names a directory laid out as a DuckDB extension repository; it is not the path of a single
`.duckdb_extension` file. Use `LoadFile` or `InstallAndLoadFile` for a standalone file. `LoadInstalled` skips installation
and loads an extension that is already present in DuckDB's extension directory, which supports images or hosts where
extensions are provisioned before server startup. `LoadFile` loads the source path directly on every connection.
`InstallAndLoadFile` first copies the file into DuckDB's extension directory, then loads the installed extension name
DuckDB derives from the filename (`custom_writer.duckdb_extension` becomes `custom_writer`), so the source path is only
needed while installation runs. Bare relative filenames are emitted with a `./` prefix so DuckDB treats them as files
rather than extension names.

`Parse` only interprets the command-line grammar. It trims surrounding whitespace around entries, names, and
repositories and rejects blank entries or extra repository delimiters. Structured values are literal because whitespace
can be part of a valid path; callers reading them from YAML, environment variables, or similar configuration should
normalize them before constructing a `Spec` if that is their desired policy.

The initializer checks only structural API mistakes, such as setting both `Name` and `Path`. It safely quotes extension
names, file paths, and custom repositories, then delegates extension names, aliases, repositories, file compatibility,
and repeated or conflicting specifications to DuckDB. Specifications are executed in caller order without
deduplication, so DuckDB's own errors remain the source of truth.

DuckDB applies `LOAD` to each physical connection, so the initializer intentionally repeats the complete ordered spec
list whenever the connector creates one. Install-and-load specs repeat `INSTALL` as well; DuckDB decides whether an
installed artifact can be reused, while each connection still receives its own `LOAD`. The first failed `INSTALL` or
`LOAD` stops initialization and returns a contextual error, so that connection is not created. A later connection
retries from the beginning. The example server's extension inventory query provides this preflight before HTTP serving
starts.

Extensions are trusted native code that run with the server process's privileges. Load only trusted repositories and
files. DuckDB signature verification is an important safeguard where it applies; allowing unsigned extensions removes
that safeguard. Local binaries must also match the DuckDB version, extension ABI, operating system, and architecture.

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
boundary, and explicitly catalog-qualified table, `SHOW`, and function references are rejected. The function blocklist
applies only to explicit function calls. Schema matching does not restrict catalog metadata returned by functions such as
`duckdb_tables()` and `pragma_table_info()`. If metadata is sensitive, add the exact metadata-function names exposed by the
deployment to `--function-blocklist`; wildcard patterns such as `duckdb_*` are not supported, and the list must be reviewed
when DuckDB or its extensions change. To restrict file-reading functions, also enable schema matching so DuckDB replacement
scans such as `FROM 'data.parquet'` are rejected as unqualified table references. These controls are not a sandbox: run the
server with access only to external resources that are safe for every tenant.

If either `--schema-match-headers` or `--function-blocklist` is configured, `json` and `arrow` requests are limited to
statements DuckDB can serialize for validation; unsupported forms such as `PRAGMA` and `SET` are rejected, with HTTP
requests receiving a 400 response. All `exec` requests are also rejected until full-statement authorization is supported.
This includes every `Coordinator.exec(...)` call, such as data loading, preloading, and DDL/DML. Mosaic pre-aggregation
also uses `exec` to create schemas and tables, so set `preagg: { enabled: false }` in this mode.

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
