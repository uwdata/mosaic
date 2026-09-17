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

The alternative [Go server](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go) uses DuckDB 1.5.5 and the signed [Gatekeeper community extension](https://duckdb.org/community_extensions/extensions/gatekeeper), tested with Gatekeeper 0.1.2. Build with `-tags=duckdb_arrow`. Startup runs `INSTALL gatekeeper FROM community` and `LOAD gatekeeper`, then checks the validation API. Installation reuses DuckDB's extension cache; an uncached installation needs network access and a writable extension directory. Failures stop startup.

For offline deployments, provision a matching signed extension and use `--gatekeeper-extension=gatekeeper` to load the installed copy without installation, or supply `--gatekeeper-extension=/absolute/path/gatekeeper.duckdb_extension`. The corresponding Go option is `query.WithGatekeeperExtension(nameOrPath)`. Unsigned development artifacts require the explicit `--allow-unsigned-extensions` flag (or `allow_unsigned_extensions=true` in an embedding application's connector DSN); production defaults verify signatures. Installation does not force upgrades: update the cached extension deliberately and rerun the integration tests when changing DuckDB or Gatekeeper.

Schema or function policy activates Gatekeeper validation on the same pooled connection used for Arrow execution. Gatekeeper's reviewed defaults apply even in schema-only or blocklist mode, and include clock and random functions. `WithFunctionAllowlist` forwards `Include`, `Exclude`, and `DisableDefaults` to request policy options; exclusions win. Without a schema/function policy, requests remain unrestricted. Any CLI schema/function policy disables `exec`, including Mosaic data loading and pre-aggregation; configure the coordinator with `preagg: { enabled: false }`.

Gatekeeper intersects request policies with a database-wide ceiling. The CLI configures that ceiling with its function additions/blocks after loading `--load-extensions`, disables `autoload_known_extensions` and `autoinstall_known_extensions`, and sets `lock_configuration=true` in validated mode. An embedding application owns trusted initialization: install/load required extensions, configure `CALL gatekeeper_configure(...)` with any elevated function grants, disable autoload/autoinstall, and lock configuration before serving. `query.New` checks the API but does not replace an existing global policy. Request `Include` entries cannot widen the global ceiling. Apply application-appropriate memory/thread limits, timeouts, and filesystem/network controls separately.

`ValidateSQL(ctx, sql, query.ValidationPolicy)` is a method on `*query.DB`. It always validates, even with an empty policy, but does not execute SQL or reserve a connection for later execution; use `QueryArrow` or `WriteArrow` for integrated validation and execution. `ValidationPolicy` contains `AllowedSchemas`, `BlockedFunctions`, and optional `FunctionAllowlist`. Nil schemas add no object restriction beyond the global ceiling; an explicit empty list denies table/view access. Schema policies become parameter-bound `allowed_tables` rules for the primary catalog captured at startup. Schema names are case-insensitive exact identifiers; `*` is rejected rather than treated as a wildcard. Both views and underlying tables must pass. Unqualified names and explicit primary-catalog qualifiers may pass when their resolved identity is allowed. Attached and temporary catalogs do not match these rules. Function namespaces use leaf-name policy independently of schema restrictions.

The Go AST `Validator`/`CheckNode` API is removed. `query.ErrorDetails` carries Gatekeeper's `Code` and structured `Violations`, including object/function identities and optional byte offsets. Use `errors.Is` with `query.ErrValidation`, `query.ErrAccessDenied`, or `query.ErrUnsupportedStatement` to classify failures. Object denials use the `table` violation rule. Policy denials map to HTTP 403, parser/binding/unsupported results to 400, and validator failures to 500. HTTP and WebSocket validation errors contain generic messages; full diagnostics are logged for operators and remain available to Go callers. Engine diagnostics may expose private catalog names and paths, so do not return them to untrusted clients. Missing objects fail binding, and schema-wide `SHOW TABLES` is denied under table restrictions.

`WithRemoteURILiteralRejection` is deprecated and fails initialization: Gatekeeper has no reader-argument policy. Its defaults deny readers and replacement file scans, including local ones. Admitting a reader in both policy layers grants its resource access, including replacement scans that resolve to that reader; table rules do not restrict reader paths. Dynamic SQL and metadata readers are denied even with explicit function admission. URI-shaped CTE names are allowed when they resolve to a real scoped CTE. Trusted view/macro expansions honor blocks and the never-bind list, but generally do not require caller allowlist grants for their internal functions. Binding can perform I/O through trusted definitions, and concurrent catalog changes between validation and execution remain a race. See Gatekeeper's [security model](https://github.com/nozzle/duckdb-gatekeeper/blob/v0.1.2/docs/security.md).

Run `go test -race -tags=duckdb_arrow ./...` from `packages/server/duckdb-server-go`. Local tests and CI install the signed community extension with signature verification enabled; no local extension build or environment variable is required.
