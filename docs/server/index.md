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

## Go Server Query Validation

The [Go server](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go)
implements schema authorization, function allowlists or blocklists, and optional
remote-URI literal checks with one embedded
[`validate.sql`](https://github.com/uwdata/mosaic/blob/main/packages/server/duckdb-server-go/pkg/query/validate.sql)
query. A private in-memory DuckDB instance serializes the submitted SQL and validates
the resulting AST before the submitted query is executed. The SQL file is canonical and lives inside the Go
module so standalone module builds can embed it; other servers can package the same
file and supply their policy inputs.

The Go adapter bootstraps each validation connection with temporary grammar tables,
the reviewed remote-reader inventory, a one-row input table, and a parameter-free
prepared validation plan. Each request exclusively borrows a connection, replaces
its entire request input, executes the plan, and returns the connection after reading
the result. This prevents schema or function policies from leaking across concurrent
requests. The validation pool uses `MaxConnections`, retains idle connections for
plan reuse, and closes with `DB.Close`.

The private validation database uses one worker thread without changing the query
database's settings. It does not execute submitted SQL or load application extensions,
macros, views, or attached catalogs. Extension-specific parser syntax is therefore
unsupported even if the execution database loads an extension that accepts it.
The same embedded SQL can still run directly with parameters; bootstrap tables are
an adapter optimization rather than a second policy implementation.

### Supported SQL

Validation checks the DuckDB 1.5.5 serialized structure against explicit rules for
statements, query nodes, table references, and expressions. Unknown fields or node
variants, missing required fields, and unexpected field types are rejected with
`query.ErrUnsupportedStatement`. Supported forms include SELECT, VALUES, set
operations, ordinary and recursive CTEs, and the existing SHOW/DESCRIBE forms.
Literal values and type metadata are treated as data rather than executable AST
nodes; strings containing SQL or JSON are not recursively interpreted.
The implementation uses `json_tree` to flatten the AST, then checks object fields
and parent/child relationships with joins rather than a recursive CTE. The grammar
supports arrays nested up to two levels (such as VALUES rows); query nesting is not
limited to that depth.
Serialization errors also reject the query. Successful serialization alone does
not authorize a statement, and a SELECT root does not exempt nested write nodes.

CTE references are authorized only within their query scope. Earlier declarations
are visible to later CTEs; nonrecursive self-references, forward references, and
references from other statements do not exempt unqualified tables. Recursive
self-references are allowed in the recursive term, not its seed query.

DuckDB upgrades require reviewing changes to the AST contract and running the
validation conformance tests. Captured v2.0 alpha ASTs, including SELECTs containing
INSERT, UPDATE, DELETE, and COPY CTEs, are currently rejected. This is not a claim
of v2.0 compatibility.

### Go API

The configuration APIs `WithFunctionAllowlist`, `WithFunctionBlocklist`, and
`WithRemoteURILiteralRejection` retain their existing behavior. Function allowlists
and nonempty blocklists are mutually exclusive. Allowlist defaults, includes, and
excludes are resolved by the existing `functionset` helpers; SQL checks the resulting
exact lowercase names, including operators represented as functions. Repeated
function violations are counted. An enabled empty allowlist denies all function
calls; an omitted allowlist imposes no allowlist restriction.

Direct callers now pass a policy to `ValidateSQL`, replacing the Go `Validator`
interface and its node callbacks:

```go
err := db.ValidateSQL(ctx, sqlText, query.ValidationPolicy{
    CheckSchemas:     true,
    AllowedSchemas:   []string{"tenant_a"},
    CheckFunctions:   true,
    AllowedFunctions: functionset.DefaultFunctions(),
})
```

`ValidationPolicy` also accepts `BlockedFunctions` and
`RejectRemoteURILiterals`. `CheckSchemas` and `CheckFunctions` distinguish an
enabled empty policy from a disabled one. Schema names are matched exactly;
direct callers supply normalized lowercase function names. `ValidateSQL` always
checks the AST structure, even with a zero-value policy. Ordinary server requests
invoke validation only when a query policy is active, and restricted `exec`
requests remain disabled.

### SQL Interface

Run the file as a parameterized query with these named inputs:

| Parameter | Type | Meaning |
| --- | --- | --- |
| `query` | `VARCHAR` | Submitted SQL as data, never interpolated into the validation query. |
| `check_schemas` | `BOOLEAN` | Enable schema and explicit-catalog restrictions. |
| `allowed_schemas` | `VARCHAR[]` | Exact authorized schema names. |
| `check_functions` | `BOOLEAN` | Enable the function allowlist. |
| `allowed_functions` | `VARCHAR[]` | Resolved lowercase allowed function names. |
| `blocked_functions` | `VARCHAR[]` | Lowercase blocked names; mutually exclusive with an enabled allowlist. |
| `reject_remote_uris` | `BOOLEAN` | Enable remote-URI literal checks. |
| `remote_readers` | `JSON` | Reviewed function-to-path-argument inventory, e.g. `{"read_parquet":{"Positional":[0],"Named":[]}}`. |

List parameters treat SQL NULL as an empty list. Supply all boolean flags explicitly.
The Go adapter supplies the path-argument inventory from `functionset/remoteread`;
other adapters must supply an equivalent reviewed inventory when enabling that
policy. The URI prefixes and matching logic are in the SQL file.

The result columns are `code`, `error_type`, `error_subtype`, `message`, and
`position`. Success is a single `ok` row. Rejection returns `forbidden`,
`unsupported`, or `parser` rows. These are internal validation codes, not wire
protocol error codes. Adapters must reject execution errors, missing results, and
unknown result codes, and execute the submitted SQL only after validation succeeds.

This remains syntactic validation: it does not bind function identity, expand
views/macros, inspect nested SQL strings, or sandbox resource access. Remote-URI
checks inspect reviewed literal path arguments; computed paths can evade them.
Catalogs and initialization must remain trusted.

The stricter SQL validation adds latency: local warm Go benchmarks on an Apple M3
Max measured approximately 3–4 ms per validation for a simple SELECT and a CTE query,
4–5 ms for 20 nested subqueries, and 17–21 ms for 100. Enabled default function
allowlists, blocklists, and remote-URI policies measured approximately 4–5 ms on
their small benchmark queries. These measurements include input binding, DuckDB
serialization, and reading results, but exclude bootstrap and execution of the
submitted SQL. The earlier Go walker measured approximately 0.1 ms for small queries;
the initial flattened SQL path took 12–13 ms. The remaining gap is substantial.

Bootstrap experiments compared input/grammar tables, SQL macros, prepared statements,
additional materialized stages, and preloaded function-name tables. Additional
stages and function-name joins did not improve the winning stable plan.
Further experiments tested regex-based parent lookup, precomputed field tables,
individual optimizer switches, policy-specialized plans, result assembly, and
combined update/execution calls. These did not produce a substantial repeatable
improvement over directly scanning the connection-local input row. An execution-only
control still took approximately 3 ms, indicating that request binding is not the
main remaining cost. `BenchmarkValidationPlans` retains the plan experiments;
its specialized variants are schema-only diagnostics, not production policy paths.

Alpha
v2.0.0-alpha41489 did not improve small-query latency: bootstrap experiments using
identical stable AST inputs took approximately 26–38 ms. Alpha compatibility is
still unreviewed. Run
`go test -tags=duckdb_arrow ./pkg/query -run '^$' -bench BenchmarkValidateSQL -benchmem`
from the Go module to measure the deployment environment.
