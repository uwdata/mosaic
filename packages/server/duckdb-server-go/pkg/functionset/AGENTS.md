# Function allowlist inventories

When changing the reviewed inventories in this package:

- Treat the DuckDB release bundled by the `duckdb-go` version in [go.mod](../../go.mod) as the source of truth. Inspect that tag's function registrations, parser rewrites, and macro bodies; use `duckdb_functions()` as a classification cross-check, not as a generated allowlist.
- Keep names lowercase, sorted, deduplicated, and grouped by the serialized `function_name`. Audit side effects, volatility, resource I/O, dynamic SQL or dispatch, and type or macro collisions. Leave uncertain names out.
- Update the catalog exemptions, reviewed macros, and collision allowlists in `functionset_test.go` only when the matching DuckDB source justifies the exception. Verify parser-generated operators and syntax helpers with `json_serialize_sql` and executable SQL because some have no catalog row.
- Keep `CoreExtensions` aligned with the bundled DuckDB release's core-extension roster, with an explicit inventory entry even when both groups are empty. Review external extensions against the exact revision pinned by DuckDB's descriptor; generated `extension_entries.hpp` data is not exhaustive.
- Keep each extension's source pin and `Compute`/`Elevated` arrays together in `<extension>.go`, using the DuckDB extension ID for the filename (for example, `unity_catalog.go`).
- Put reviewed local computation or embedded static data with no resource or state effects in `Compute`; it is enabled by `DefaultFunctions`. Put resource, mutation, dynamic dispatch, catalog/session inspection, current-time, and source-limited runtime-verified names in `Elevated`. Treat catalog volatility as elevated unless exact pinned source proves the function is pure by argument. Classify a shared name by its most capable overload because validation does not bind signatures.
- Update the pinned counts and classification table in [README.md](../../README.md) with the inventories. Document source-only or runtime-only limitations, especially MotherDuck's non-exhaustive proprietary runtime snapshot, and keep loading, autoloading, replacement scans, `ATTACH`, settings, and other non-function mechanisms outside the function-group claim.
- As a secondary compatibility check, compare the functions emitted by [Mosaic SQL](../../../../mosaic/sql/src/index.ts). Do not copy `aggregateNames` or exports wholesale: they can be stale or include unsafe macros and non-function syntax.

Run from the Go server module root (`../..`):

```sh
go test -count=1 -tags=duckdb_arrow ./...
go test -race -count=1 -tags=duckdb_arrow ./...
```
