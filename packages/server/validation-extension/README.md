# Native validation extension PoC

An opt-in C++ alternative to the SQL validator experiment in
[#1242](https://github.com/uwdata/mosaic/pull/1242). No server execution path is
changed. The extension registers `mosaic_validate_ast(VARCHAR, VARCHAR)` through
DuckDB's C extension API v1.2.0. It does not link DuckDB's internal C++ API or build
the engine. yyjson parses the input; immutable grammar rules are initialized once
per registration, while all request state is local to the call.

## Build and run

Requires Python 3, a C/C++17 compiler, and a DuckDB CLI matching the host platform.
Tested on macOS arm64 with DuckDB 1.5.5 and Apple clang 21. Linux builds are
provided by the script but have not been tested; Windows is not supported by it.

From the repository root:

```sh
python3 packages/server/validation-extension/build.py
export MOSAIC_NATIVE_VALIDATION_EXTENSION="$PWD/packages/server/validation-extension/build/mosaic_validation.duckdb_extension"
```

The script fetches headers and serialization specifications pinned to DuckDB
`d8cdaa33fda8df955cc76ef58a280f68f4cd43fa` (v1.5.5) and yyjson pinned to
`8b4a38dc994a110abaec8a400615567bd996105f` (v0.12.0). Their licenses and generated
grammar are retained in ignored `build/`. No binaries or downloaded dependencies
are committed. The extension has unsigned development metadata; use it only in
an explicitly enabled test process:

```sh
duckdb -init /dev/null -unsigned
```

```sql
LOAD '/absolute/path/to/mosaic_validation.duckdb_extension';
SELECT mosaic_validate_ast(
    system.main.json_serialize_sql(
        'SELECT * FROM tenant_a.orders',
        skip_default := true, skip_empty := true, skip_null := true
    )::VARCHAR,
    '{"check_schemas":true,"allowed_schemas":["tenant_a"]}'
);
```

Result (a VARCHAR containing JSON):

```json
{"allowed":true,"code":"ok","violations":[]}
```

The function accepts serialized AST data, not arbitrary SQL. A server must generate
the AST from the exact submitted SQL using the qualified serializer and all three
skip flags above. Do not authorize caller-supplied ASTs as substitutes for SQL.
Results can have codes `ok`, `forbidden`, `unsupported`, `parser`, or
`invalid_input`. NULL inputs are explicitly denied. Execution errors also deny the
request. Parser errors are currently returned as messages without the full Go
`ErrorDetails` structure.

## Policy

All fields are optional except that enabling remote checks requires its inventory.
Unknown/duplicate policy fields and incorrectly typed fields are rejected.

| Field | Type | Meaning |
| --- | --- | --- |
| `check_schemas` | boolean | Enable schema and explicit-catalog restrictions. |
| `allowed_schemas` | string array | Exact schema names. |
| `check_functions` | boolean | Enable exact-name function allowlist. |
| `allowed_functions` | string array | Resolved lowercase names, including operators. |
| `blocked_functions` | string array | Exact lowercase blocklist; cannot accompany an enabled allowlist. |
| `reject_remote_uris` | boolean | Enable reviewed URI literal checks. |
| `remote_readers` | object | Function/path-argument inventory, e.g. `{"read_parquet":{"Positional":[0],"Named":[]}}`. |

Go tests supply the existing `functionset` defaults and `remoteread` inventory.
Enabled empty allowlists deny every explicit function call. Repeated function
violations include occurrence counts. CTEs respect statement scope, declaration
order, nested scope, and recursive-term visibility.

## Tests and benchmarks

With the absolute extension environment variable above set, run from
`packages/server/duckdb-server-go`:

```sh
go test -tags=duckdb_arrow ./pkg/query -run NativeValidation -count=1
go test -tags=duckdb_arrow ./pkg/query -run '^$' -bench BenchmarkNativeValidationPoC -benchmem
```

Without that variable the tests skip. Coverage includes nested references,
CTE-scope bypasses, catalogs, functions, remote paths, unsupported statement/AST
shapes, NULLs, vectorized batches, and concurrent policies.

Initial Apple M3 Max measurements, including serialization and result decoding:

| Query | Existing Go schema validator | Native schema validator | Native + default allowlist |
| --- | ---: | ---: | ---: |
| Simple SELECT | 0.095 ms | 0.101 ms | 0.178 ms |
| CTE + subquery | 0.136 ms | 0.130 ms | 0.209 ms |
| 20 nested subqueries | 0.198 ms | 0.155 ms | 0.231 ms |

The native implementation additionally checks supported AST structures. The
allowlist column includes decoding the full inventory on each call, but policy
JSON encoding happens outside the timed loop. This is not a pure language-speed
comparison. No prepared-plan or result cache is used. The SQL experiment's
bootstrap-backed path was approximately 3–4 ms for small queries.

## Boundaries and follow-ups

This is an experimental validator, not production authorization. The generated
grammar uses an explicit class allowlist and field-type mapping against pinned
serialization specifications; it must be reviewed before changing the pin.
Opaque literal/type metadata is not executable AST. Expression variants have an
explicit allowlist. Traversal rejects more than 100,000 visited nodes or 512
levels, AST inputs over 8 MiB, and policy inputs over 1 MiB.

The same binary loaded in v2.0.0-alpha41489 on this host and rejected its
write-containing CTE AST (`missing CommonTableExpressionInfo.query`). That is a
load/rejection probe, not a v2 compatibility guarantee. Future work includes the
full cross-server conformance corpus, fuzzing/sanitizers, other platforms, signed
distribution, validated policy precompilation, and richer error mapping. Names
are ASCII case-folded in this PoC; non-ASCII function-name parity needs review.

Validation is syntactic: views/macros and SQL strings are not expanded, function
identity is not bound, and remote literal checks are not a resource sandbox. The
server must trust its catalog and extension installation and execute only after a
successful result. Extension code is native code inside the DuckDB process.
