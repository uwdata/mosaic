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

## Native Validation Experiment

The repository includes an opt-in
[C++ validation extension PoC](https://github.com/uwdata/mosaic/tree/main/packages/server/validation-extension).
It registers `mosaic_validate_ast(ast_json, policy_json)`, returning a JSON string
with `allowed`, `code`, and `violations`. Servers can pass the output of
`system.main.json_serialize_sql` directly into it, keeping serialization and
validation in one SQL call without a SQL traversal plan.

The PoC checks supported DuckDB 1.5.5 AST structures, schema/catalog references,
scoped CTEs, exact function allowlists/blocklists, and reviewed remote URI literals.
All request policy state is passed explicitly. Server execution paths continue to
use the existing Go validator; this extension is exercised only by opt-in tests
and benchmarks.

Build with `python3 packages/server/validation-extension/build.py`, then follow
the extension README for loading the unsigned development artifact in an isolated
test process. The build pins DuckDB and yyjson source revisions and does not
compile the full DuckDB engine. Initial macOS arm64 benchmarks measured approximately
0.10–0.16 ms for schema validation, including serialization and result decoding;
the full default function allowlist increased that to approximately 0.18–0.23 ms.

This is not production authorization or a sandbox. Other platforms, complete
conformance, fuzzing, signed distribution, and version compatibility require
further work. Unknown AST shapes are rejected; v2.0 alpha ASTs are not supported.
