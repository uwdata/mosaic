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

The Go adapter keeps, per server-level policy, a pool of validation connections
that each hold one prepared, parameter-free validation statement. Each request
exclusively borrows a connection, publishes its query and schema policy through
the connection's request slot, executes the plan, and returns the connection after
reading the result. This prevents schema or function policies from leaking across
concurrent requests. The pools share a `MaxConnections` cap, retain idle
connections for plan reuse, and close with `DB.Close`.

The private validation database uses one worker thread without changing the query
database's settings. It does not execute submitted SQL or load application extensions,
macros, views, or attached catalogs. Extension-specific parser syntax is therefore
unsupported even if the execution database loads an extension that accepts it.

### Supported SQL

Validation checks the DuckDB 1.5.5 serialized structure against explicit rules for
statements, query nodes, table references, and expressions. Unknown fields or node
variants, missing required fields, and unexpected field types are rejected with
`query.ErrUnsupportedStatement`. Supported forms include SELECT, VALUES, set
operations, ordinary and recursive CTEs, and the existing SHOW/DESCRIBE forms.
Literal values and type metadata are treated as data rather than executable AST
nodes; strings containing SQL or JSON are not recursively interpreted.
The implementation uses `json_tree` to flatten the AST, derives each node's field
and owner from its JSON path, and checks parent/child relationships with a single
self-join rather than a recursive CTE. The grammar
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

The file is a template. Server-level policy is substituted into `@@name@@`
placeholders once, when the statement is prepared, so DuckDB prunes disabled
branches at plan time; per-request inputs arrive through a scalar function call:

| Placeholder | SQL literal | Meaning |
| --- | --- | --- |
| `@@check_functions@@` | `BOOLEAN` | Enable the function allowlist. |
| `@@allowed_functions@@` | `VARCHAR[]` | Resolved lowercase allowed function names. |
| `@@blocked_functions@@` | `VARCHAR[]` | Lowercase blocked names; mutually exclusive with an enabled allowlist. |
| `@@reject_remote_uris@@` | `BOOLEAN` | Enable remote-URI literal checks. |
| `@@remote_prefixes@@` | `VARCHAR[]` | Recognized remote URI prefixes. |
| `@@remote_readers@@` | `MAP(VARCHAR, STRUCT(positional BIGINT[], named VARCHAR[]))` | Reviewed function-to-path-argument inventory. |
| `@@request@@()` | volatile function returning `VARCHAR` | JSON object `{"query": ..., "check_schemas": ..., "allowed_schemas": [...]}` for the current request. |

The request function is the reason the statement is fast: DuckDB refuses to cache a
prepared plan whose parameters feed a table function scan (`json_tree`), so a
parameterized statement is re-planned on every call, and planning this query costs
several milliseconds. A zero-parameter statement is planned once per connection.
The function must be volatile so it is not folded at bind time, and the
`json_tree` input stays wrapped in a scalar subquery so `json_tree` binds in
table-in-out mode instead of evaluating its argument at bind time. The Go adapter
registers one such UDF, keeps a prepared statement per pooled validation
connection, and passes a per-connection slot id as the function argument. Other
adapters can substitute any equivalent volatile function, or substitute a
constant literal and accept re-planning.

Grammar rules are embedded as one `MAP` constant folded at plan time. Object
fields are read with a single `json_extract_string` over a fixed path list, and
the grammar's required-field lists hold indices into that list, so keep the two
in sync when changing either. The Go adapter supplies the path-argument inventory
from `functionset/remoteread`; other adapters must supply an equivalent reviewed
inventory when enabling that policy.

The result columns are `code`, `error_type`, `error_subtype`, `message`, and
`position`. Success is a single `ok` row. Rejection returns `forbidden`,
`unsupported`, or `parser` rows. These are internal validation codes, not wire
protocol error codes. Adapters must reject execution errors, missing results, and
unknown result codes, and execute the submitted SQL only after validation succeeds.

This remains syntactic validation: it does not bind function identity, expand
views/macros, inspect nested SQL strings, or sandbox resource access. Remote-URI
checks inspect reviewed literal path arguments; computed paths can evade them.
Catalogs and initialization must remain trusted.

SQL validation adds latency over the earlier Go walker (approximately 0.1 ms
including serialization). Local warm Go benchmarks on an Apple M3 Max measured
approximately 1.4 ms per validation for a simple SELECT, 1.7 ms for a CTE query,
2.2 ms for 20 nested subqueries, and 10 ms for 100; enabled default function
allowlists, blocklists, and remote-URI policies measured 1.7–1.9 ms on their small
benchmark queries. Roughly 0.2 ms of that is DuckDB serialization and roughly
0.7 ms is fixed pipeline overhead for the plan. Under concurrent load the pooled
prepared statements sustain approximately 0.5 ms per validation. The initial
parameterized statement measured 12–13 ms for the small queries and 25 ms for 100
nested subqueries because DuckDB re-planned it on every call; a connection-local
input table with a parameter-free plan measured 3–4 ms. Neither variant executes
the submitted query. Run
`go test -tags=duckdb_arrow ./pkg/query -run '^$' -bench BenchmarkValidateSQL -benchmem`
from the Go module to measure the deployment environment.
