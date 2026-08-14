# Function allowlist inventories

When changing the reviewed inventories in `pkg/functionset`:

- Treat the DuckDB release bundled by the `duckdb-go` version in `go.mod` as the source of truth. Inspect that tag's function registrations, parser rewrites, and macro bodies; use `duckdb_functions()` as a classification cross-check, not as a generated allowlist.
- Keep names lowercase, sorted, deduplicated, and grouped by the serialized `function_name`. Audit side effects, volatility, resource I/O, dynamic SQL or dispatch, and type or macro collisions. Leave uncertain names out.
- Update the catalog exemptions, reviewed macros, and collision allowlists in `functionset_test.go` only when the matching DuckDB source justifies the exception. Verify parser-generated operators and syntax helpers with `json_serialize_sql` and executable SQL because some have no catalog row.
- Review opt-in extension sets against the extension revision pinned by the bundled DuckDB tag. Keep resource-capable names out of `DefaultFunctions` and state their behavior in the helper's documentation.
- As a secondary compatibility check, compare the functions emitted by [Mosaic SQL](../../mosaic/sql/src/index.ts). Do not copy `aggregateNames` or exports wholesale: they can be stale or include unsafe macros and non-function syntax.

Run from this directory:

```sh
go test -count=1 -tags=duckdb_arrow ./...
go test -race -count=1 -tags=duckdb_arrow ./...
```
