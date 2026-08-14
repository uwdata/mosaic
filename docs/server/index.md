# Mosaic DuckDB Server

The Mosaic `duckdb-server` package provides a Python-based server that runs a local DuckDB instance and support queries over Web Sockets or HTTP, returning data in either [Apache Arrow](https://arrow.apache.org/) or JSON format.

::: tip
This package provides a local DuckDB server. To instead use DuckDB-WASM in the browser, use the `wasmConnector` from the [`mosaic-core`](/core/) package.
:::

::: info
DuckDB can also connect to and query other databases, such as PostgreSQL and MySQL. See the [multi-database support page](/api/core/multi-database-support) for examples.
:::

## Go Server

Mosaic also provides an embeddable [DuckDB Go server](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go).
Applications that need local file readers but want to reject common caller-supplied remote locations can enable the strict
query option:

```go
query.WithRemoteURILiteralRejection()
```

The option rejects recognized remote URI literals in DuckDB replacement scans and
[reviewed function path arguments](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go/pkg/functionset/remoteread),
including literal lists and literals within path expressions. It uses DuckDB 1.5.5's prefixes: `http://`, `https://`,
`s3://`, `s3a://`, `s3n://`, `gcs://`, `gs://`, `r2://`, `hf://`, `azure://`, `az://`, and `abfss://`. Unrelated string
literals remain unaffected. Ordinary local paths remain usable unless the path string itself contains a recognized marker.
Trusted connector initialization can load extensions and attach remote catalogs before serving queries; subsequent queries
against those catalogs remain usable.

DuckDB's serialized AST cannot distinguish a replacement-scan string from a quoted table or CTE identifier, so URI-shaped
identifiers are rejected too. This check is best-effort, not a network sandbox. Split or computed strings, macros, views,
nested SQL, extension-defined schemes, GDAL virtual paths, remote locations reached through local Iceberg or Delta
metadata, and SQL stored in SQLite views can evade it. Enabling the option also rejects `exec` commands, leaving only
validated query forms. See the Go server's
[security documentation](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go#remote-uri-literal-policy)
for the full boundary.

## Usage

The server package is available on [PyPi](https://pypi.org/project/duckdb-server/).

We recommend running the server in an isolated environment with [pipx](https://github.com/pypa/pipx). For example, to directly run the server, use:

```bash
pipx run duckdb-server
```

Alternatively, you can install the server with `pip install duckdb-server`. Then you can start the server with `duckdb-server`.

## Developer Setup

To run the server from the Mosaic repository and to run the server in development mode, follow the [instructions for the duckdb-server package](https://github.com/uwdata/mosaic/blob/main/packages/server/duckdb-server/README.md).
