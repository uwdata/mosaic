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

## Go Server with Local HTTPS

The [Go server](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go) can configure localhost HTTPS automatically:

```sh
go install -tags=duckdb_arrow github.com/uwdata/mosaic/packages/server/duckdb-server-go@latest
duckdb-server-go --https
```

On first use, it generates a local CA and a certificate for `localhost`, `127.0.0.1`, and `::1`, then installs the CA into the system trust store. Run from an interactive terminal; macOS and Linux may request administrator permission. Connect to `https://localhost:3000` to use HTTP/2 with supporting clients, or `wss://localhost:3000` for WebSockets.

Certificates are reused and renewed automatically. See the [Go server README](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go#local-https) for certificate precedence, storage, browser trust setup, and removal instructions.

## Developer Setup

To run the server from the Mosaic repository and to run the server in development mode, follow the [instructions for the duckdb-server package](https://github.com/uwdata/mosaic/blob/main/packages/server/duckdb-server/README.md).
