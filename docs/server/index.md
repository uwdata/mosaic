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

The alternative [Go server](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go) uses DuckDB 1.5.5 and the signed [Gatekeeper community extension](https://duckdb.org/community_extensions/extensions/gatekeeper), tested with Gatekeeper 0.2.0. Build with `-tags=duckdb_arrow`.

Validation is active whenever `--schema-match-headers`, `--function-blocklist`, or `--function-allowlist` is set. At startup the server then loads an already-installed Gatekeeper or runs `INSTALL gatekeeper FROM community` and `LOAD gatekeeper`, applies the function flags with `CALL gatekeeper_configure(...)`, disables `autoload_known_extensions` and `autoinstall_known_extensions`, and sets `lock_configuration=true`. The first community install needs network access and a writable extension directory; DuckDB does not upgrade a cached extension on its own. Failures stop startup. Without those flags the server never touches Gatekeeper and requests remain unrestricted.

To provide Gatekeeper yourself, install it through `--load-extensions`, which runs before the community fallback: `--load-extensions=gatekeeper|community`, or `--load-extensions=/path/gatekeeper.duckdb_extension` for an offline signed artifact. Unsigned development builds additionally require `--database=':memory:?allow_unsigned_extensions=true'`.

To upgrade an existing community installation, run `FORCE INSTALL gatekeeper FROM community` using DuckDB 1.5.5 with the server's extension directory, then restart the server. Ordinary `INSTALL` and `LOAD` reuse a cached artifact. CI uses a separate extension-cache key for Gatekeeper 0.2.0.

Gatekeeper intersects each request with a database-wide ceiling. The CLI's function flags configure that ceiling, so `--function-allowlist` and `--function-blocklist` may be combined and blocked names win. Gatekeeper's reviewed defaults apply in every validated mode, including schema-only and blocklist-only, and include clock and random functions. Readers, replacement scans, metadata functions, and dynamic SQL are denied by default. Any validated mode disables `exec`, including Mosaic data loading and pre-aggregation; configure the coordinator with `preagg: { enabled: false }`.

Schema matching authorizes caller references to resolved tables and views in the primary catalog captured at startup. Unqualified names and explicit primary-catalog qualifiers pass when their resolved identity is allowed; direct references to attached and temporary catalogs do not. Schema names are case-insensitive exact identifiers, and `*` is rejected. Missing objects fail binding, and schema-wide `SHOW TABLES` is denied. Validation and Arrow execution share one pooled connection.

Gatekeeper 0.2.0 treats trusted views, macros, and attached tables as capabilities: their dependencies are exempt from table and function policies, including blocks and the never-bind list. An allowed view may expose tables in another tenant's schema; only trusted initialization should create or modify definitions. A caller's separate reference to the same underlying table or function is still checked. To withdraw a capability, deny its outer view or macro. Gatekeeper's policy, enforcement, and logging controls remain forbidden even through trusted definitions.

Embedding applications own trusted initialization: install and load Gatekeeper and any other extensions in the connector's init callback, grant functions with `CALL gatekeeper_configure(...)`, disable autoload/autoinstall, and lock configuration. Then construct `query.New(ctx, connector, query.WithValidation())`, which validates every Arrow query, disables `Exec`, and fails when Gatekeeper is not loaded. Per-request narrowing uses `query.ValidationPolicy`, which mirrors `gatekeeper_validate`: `AllowedSchemas` (nil adds no object restriction; an empty list denies all tables), `AllowedFunctions` (nil inherits the global allowlist; a non-nil list intersects with it), `BlockedFunctions`, and `DisableDefaultFunctions`. Pass a policy to `QueryArrow` or `WriteArrow` to validate and execute on the same connection, or to `ValidateSQL` to validate without executing. Applications embedding `pkg/server` that derive tenancy from a typed payload rather than headers can return the per-command policy from `server.WithPolicyAuthorizer`. Apply application-appropriate memory/thread limits, timeouts, and filesystem/network controls separately.

`query.ErrorDetails` carries Gatekeeper's `Code`, `Type`, `Message`, `Position`, and structured `Violations`. Use `errors.Is` with `query.ErrValidation`, `query.ErrAccessDenied`, or `query.ErrUnsupportedStatement` to classify failures. Policy denials map to HTTP 403, parser/binding/unsupported results to 400, and validator failures to 500. HTTP and WebSocket validation errors contain generic messages; full diagnostics are logged for operators and remain available to Go callers. Engine diagnostics may expose private catalog names and paths, so do not return them to untrusted clients.

Mosaic uses `gatekeeper_validate` with per-request policies followed by execution on the same connection. Gatekeeper 0.2.0 also offers permanent connection enforcement, but that global-policy-only mode is not enabled by Mosaic. Binding can perform I/O through trusted definitions, and concurrent catalog changes between validation and execution remain a race. See Gatekeeper's [security model](https://github.com/nozzle/duckdb-gatekeeper/blob/v0.2.0/docs/security.md). Run `go test -race -tags=duckdb_arrow ./...` from `packages/server/duckdb-server-go`; tests and CI install the signed community extension with signature verification enabled.
