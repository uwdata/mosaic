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

## Response compression

Arrow HTTP responses negotiate gzip through `Accept-Encoding`, honoring quality
weights and explicit exclusions. Gzip level 6 is used when gzip is at least as
preferred as identity and the response is at least 1 KiB. Smaller responses stay
uncompressed unless identity is explicitly unacceptable. Omitting the header
selects identity. Arrow responses include `Vary: Accept-Encoding` and return
status 406 when neither gzip nor identity is acceptable. Empty `exec` responses
and HTTP errors are not compressed.

WebSocket Arrow messages of at least 1 KiB request compression when the client
negotiates permessage-deflate. Clients without the extension still receive
uncompressed messages. `exec` acknowledgements (`{}`) and error objects are sent
as JSON text messages.

## Developer Setup

To run the server from the Mosaic repository and to run the server in development mode, follow the [instructions for the duckdb-server package](https://github.com/uwdata/mosaic/blob/main/packages/server/duckdb-server/README.md).
