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

## Go Server

The repository also includes a [Go implementation of the server](https://github.com/uwdata/mosaic/blob/main/packages/server/duckdb-server-go/README.md). This section applies to the Go server only.

The Go server always compresses HTTP responses of at least 1 KiB with gzip or zstd according to the request's `Accept-Encoding` header, preferring zstd when the client accepts both, and adds `Vary: Accept-Encoding` to command responses. When response caching is enabled, a compressed response's strong ETag ends in `-gzip` or `-zstd` before the closing quote so that it identifies the encoded representation. `If-None-Match` and `If-Match` compare against the tag of the representation selected for the request, so a tag from a differently encoded response does not match, and a `304` response carries the selected representation's tag. See the Go README for configuration, caching, authorization, and Gatekeeper details.

## Developer Setup

To run the server from the Mosaic repository and to run the server in development mode, follow the [instructions for the duckdb-server package](https://github.com/uwdata/mosaic/blob/main/packages/server/duckdb-server/README.md).
