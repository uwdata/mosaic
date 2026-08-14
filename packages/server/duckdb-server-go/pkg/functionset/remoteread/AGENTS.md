# Remote-read function inventory

These rules extend the parent `functionset` inventory guidance for this
directory.

- Keep this package data-only. It identifies arguments through which reviewed
  functions can receive a caller-controlled URI or path; query parsing,
  expression traversal, URI-prefix matching, replacement scans, and policy
  errors belong to the query package.
- Audit the exact DuckDB release bundled by `duckdb-go` and the exact external
  extension revisions pinned by that release. Trace registrations, overloads,
  aliases, macros, parser rewrites, and the code that opens or resolves the
  argument. Use `duckdb_functions()` only as a cross-check.
- Include every positional and named selector that can carry a path across all
  overloads. Positional indexes are zero-based among unnamed SQL arguments;
  named selectors use DuckDB's lowercase serialized names.
- This is a deny-oriented sink inventory. Do not silently omit a credible but
  uncertain reader: resolve it against pinned source or include it
  conservatively and document the uncertainty in `README.md`.
- Keep source groups, function names, positional indexes, and named selectors
  sorted and deduplicated. Update the pinned sources, inventory table,
  exclusions, limitations, and count in `README.md` with every change.
- Separately audit replacement scans and non-function read surfaces on every
  DuckDB upgrade. Document them in `README.md`; do not add them to this
  function-argument API.
- Run `go test ./pkg/functionset/remoteread` from
  `packages/server/duckdb-server-go`. The invariant tests must cover every
  inventoried name and selector.
