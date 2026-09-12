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

## Go server validation

The alternative [Go server](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go) uses DuckDB 1.5.5 and loads [Gatekeeper](https://github.com/nozzle/duckdb-gatekeeper) at startup. Supply a local artifact with `--gatekeeper-extension=/absolute/path/gatekeeper.duckdb_extension`. Unsigned development artifacts require the explicit `--allow-unsigned-extensions` flag; the default still checks signatures. Build with `-tags=duckdb_arrow`.

The current Arrow/exec protocol, typed command authorizers, and HTTP caching options are retained. Schema or function policy activates Gatekeeper validation on the same pooled connection used for execution. Gatekeeper's reviewed defaults apply even in schema-only or blocklist mode. `WithFunctionAllowlist` forwards `Include`, `Exclude`, and `DisableDefaults` to native policy options; exclusions win. Function policy continues to disable `exec`.

`query.ValidateSQL` is a method on `*query.DB` with signature `ValidateSQL(ctx, sql, query.ValidationPolicy)`. `ValidationPolicy` contains `AllowedSchemas`, `BlockedFunctions`, and optional `FunctionAllowlist`. Nil schemas leave object schemas unrestricted; an explicit empty list denies table/view access. Schema policies also restrict objects to the primary catalog captured at startup. Both views and underlying tables must pass. Unqualified names and explicit primary-catalog qualifiers may pass when their resolved identity is allowed.

The Go AST `Validator`/`CheckNode` API is removed. `query.ErrorDetails` carries Gatekeeper's `Code` and structured `Violations`, including object/function identities and optional byte offsets. Policy denials map to HTTP 403, and parser/binding/unsupported results to 400. Missing objects now fail binding. Schema-wide `SHOW TABLES` is denied because it accesses system views outside the object policy.

`WithRemoteURILiteralRejection` is deprecated and fails initialization: Gatekeeper has no reader-argument policy. Its defaults deny external readers and implicit file scans, including local ones, and nested SQL execution. Admitting an explicit reader grants its resource access; enforce filesystem/network restrictions outside the validator. URI-shaped CTE names are allowed when they resolve to a real scoped CTE. Trusted view/macro implementations, binding-time I/O, and concurrent catalog changes remain relevant boundaries.

For local regression tests, build the pinned Gatekeeper revision documented in the Go package README, set `GATEKEEPER_EXTENSION` to the artifact, and run `go test -race -tags=duckdb_arrow ./...` from the Go package. Tests use isolated unsigned-enabled databases.
