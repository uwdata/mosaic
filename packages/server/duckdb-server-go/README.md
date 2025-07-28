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
-   `--cache-size <size>`: The maximum number of cache entries. Defaults to 1000.
-   `--cert <path>`: Path to a TLS certificate file to enable HTTPS.
-   `--key <path>`: Path to a TLS private key file to enable HTTPS.
-   `--schema-match-headers`: Comma-separated list of headers to match against schema names for multi-tenant access control (e.g., "X-Tenant-Id,verified-user-id").

By default, the server will look for `localhost.pem` and `localhost-key.pem` in the current directory to enable HTTPS if the `--cert` and `--key` flags are not provided.

Create certificates for localhost with [mkcert](https://github.com/FiloSottile/mkcert)

```sh
mkcert -install # Install mkcert CA
mkcert localhost # create localhost.pem and localhost-key.pem
```

### Multi-Tenant Access Control

`schema-match-headers` isn't part of the mosaic server API, but is provided here as an example of how to have
multiple users / customers share the same DuckDB server instance while keeping their data isolated.

1. **Client side**: set `preagg.schema` when calling `new Coordinator` ([docs](https://idl.uw.edu/mosaic/api/core/coordinator.html#constructor)) to
   something like a tenant id, user id, or organization id. If you want results to be shared across users, you should
   use tenant ids or organization ids, not user ids. Mosaic will use that value as the schema name for any temporary
   tables with pre-aggregated data. Note that any of your own queries for preloading data will also need to use that schema name.
2. **Authentication**: This implementation assumes that there is some authentication mechanism in place that sets the
   trusted authentication headers in the request. The server will use these headers to determine which schema
   to use for the query. This might be a server-side cookie sent through with mosaic requests, or a header set on outbound
   requests from the client, which are verified in an api gateway or server middleware before reaching the DuckDB server.
3. **Server side**: Start the server with `--schema-match-headers=X-Tenant-Id,verified-user-id`, or whatever headers
   you trust to match against schema names. Inbound requests will be checked for these headers, and if they are present,
   the server will allow access to any schemas that match the header values. If no headers are present, and `--schema-match-headers`
   is set, the server will return a 401 Unauthorized error.

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
