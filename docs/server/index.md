# Mosaic DuckDB Server

The Mosaic `duckdb-server` package provides a Python-based server that runs a local DuckDB instance and support queries over Web Sockets or HTTP, returning data in either [Apache Arrow](https://arrow.apache.org/) or JSON format.

::: tip
This package provides a local DuckDB server. To instead use DuckDB-WASM in the browser, use the `wasmConnector` from the [`mosaic-core`](/core/) package.
:::

::: info
DuckDB can also connect to and query other databases, such as PostgreSQL and MySQL. See the [multi-database support page](/api/core/multi-database-support) for examples.
:::

## Usage

The server package is available on [PyPi](https://pypi.org/project/duckdb-server/).

We recommend running the server in an isolated environment with [pipx](https://github.com/pypa/pipx). For example, to directly run the server, use:

```bash
pipx run duckdb-server
```

Alternatively, you can install the server with `pip install duckdb-server`. Then you can start the server with `duckdb-server`.

## Developer Setup

To run the server from the Mosaic repository and to run the server in development mode, follow the [instructions for the duckdb-server package](https://github.com/uwdata/mosaic/blob/main/packages/server/duckdb-server/README.md).

## Go Server HTTP Caching

The [Go server](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go) also serves JSON and Arrow queries over HTTP GET using `type` and `sql` query parameters. Programs embedding its `pkg/server` package can configure Cache-Control and Vary independently:

```go
handler, err := server.New(db,
	server.WithCacheControl("private, max-age=60"),
	server.WithVary("X-Tenant-Id"),
)
```

`WithCacheControl(value)` applies the supplied header value to successful GET `json` and `arrow` responses and enables ETags. A matching `If-None-Match` returns a bodyless `304` with the cache headers. Authorization and query execution still run during revalidation. `If-Match` takes precedence and returns `412` if its strong validator does not match. Other responses receive `no-store` while this option is enabled. An omitted or empty value preserves existing behavior.

`WithVary(headers ...string)` appends request header names to existing Vary values, including those required by CORS, on every response. Pass a string slice with `headers...`. It works independently of Cache-Control and does not enable ETags by itself. No additional names are configured by default; `*` is supported. Names are copied and normalized, and repeated options replace the earlier configuration.

The equivalent CLI flags are `--cache-control='private, max-age=60'` and `--vary=X-Tenant-Id`; `--vary` accepts comma-separated names and can be repeated. The application chooses cache sharing, freshness, and relevant request headers. Cache keys must include the full query string. Vary distinguishes cached responses but does not enforce authorization; shared caches must authorize access to protected data before serving it. See the [Go server caching reference](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go#http-response-caching) for the full contract.
