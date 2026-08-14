# Remote-read function inventory

This package identifies reviewed DuckDB functions whose arguments can cause a
caller-controlled URI or path to be read. It is intentionally only an
inventory: the query package decides which expressions to inspect and which URI
prefixes to reject.

The query-layer prefix inventory is reviewed separately against the actual
`CanHandleFile` routing and scheme helpers in the pinned
[HTTPFS](https://github.com/duckdb/duckdb-httpfs/tree/827222fb45a043a7a852d1f7aae46901492a3cda/src) and
[Azure](https://github.com/duckdb/duckdb-azure/tree/003214c96d0caa39d5c3e27a9e1976a0692c7d37/src)
filesystem sources. DuckDB's generated extension-prefix map is only an
autoloading cross-check and omits `abfs://`, which the pinned Azure DFS
filesystem accepts.

The inventory contains 58 normalized function names reviewed against DuckDB
1.5.5 at
[`d8cdaa33`](https://github.com/duckdb/duckdb/tree/d8cdaa33fda8df955cc76ef58a280f68f4cd43fa).
Positional indexes are zero-based among unnamed SQL arguments. Named selectors
are lowercase DuckDB argument names. Each entry unions the path-bearing
selectors of all reviewed overloads.

| Source | Selectors | Functions |
| --- | --- | --- |
| [DuckDB core](https://github.com/duckdb/duckdb/tree/d8cdaa33fda8df955cc76ef58a280f68f4cd43fa/src/function/table) | `0`; `histogram` and `histogram_values` also `source` | `glob`, `histogram`, `histogram_values`, `query_table`, `read_blob`, `read_csv`, `read_csv_auto`, `read_duckdb`, `read_text`, `sniff_csv` |
| [Parquet](https://github.com/duckdb/duckdb/tree/d8cdaa33fda8df955cc76ef58a280f68f4cd43fa/extension/parquet) | `0` | `parquet_bloom_probe`, `parquet_file_metadata`, `parquet_full_metadata`, `parquet_kv_metadata`, `parquet_metadata`, `parquet_scan`, `parquet_schema`, `read_parquet` |
| [JSON](https://github.com/duckdb/duckdb/tree/d8cdaa33fda8df955cc76ef58a280f68f4cd43fa/extension/json) | `0` | `read_json`, `read_json_auto`, `read_json_objects`, `read_json_objects_auto`, `read_ndjson`, `read_ndjson_auto`, `read_ndjson_objects` |
| [Delta](https://github.com/duckdb/duckdb-delta/tree/45c40878601b54b4188b09e08732fe0d576ad222) | `0`; `copy_dir` also `src_dir`; `delta_scan` also `log_tail` | `copy_dir`, `delta_domain_metadata`, `delta_list_files`, `delta_scan` |
| [Iceberg](https://github.com/duckdb/duckdb-iceberg/tree/45163a28e0ed6a2071a82a1bf1dd432d0216cf9c) | `0` | `iceberg_column_stats`, `iceberg_metadata`, `iceberg_partition_stats`, `iceberg_scan`, `iceberg_snapshots` |
| [Spatial](https://github.com/duckdb/duckdb-spatial/tree/eb1e57c9d92c0f3f76eb03eaa52c315090f328cc) | `0`; `st_read` also `sibling_files` | `shapefile_meta`, `st_read`, `st_read_meta`, `st_readosm`, `st_readshp` |
| [Lance](https://github.com/lance-format/lance-duckdb/tree/2f167ea1aa8b1201c89d53740b84deb00aff680e) | `0` | `__lance_cleanup_old_versions`, `__lance_compact_files`, `__lance_exec`, `__lance_namespace_scan`, `__lance_optimize_index`, `__lance_scan`, `__lance_set_auto_cleanup`, `__lance_show_auto_cleanup`, `lance_fts`, `lance_hybrid_search`, `lance_vector_search` |
| [DuckLake](https://github.com/duckdb/ducklake/tree/d8a1881e22516ea3d186d73e83c65fe5bd1a1dc4) | `2` | `ducklake_add_data_files` |
| [SQLite](https://github.com/duckdb/duckdb-sqlite/tree/f79b1db7d7730b18d0f8400d3650ffa6b45168d8) | `0` | `sqlite_attach`, `sqlite_scan` |
| [Avro](https://github.com/duckdb/duckdb-avro/tree/f9d590297485f0318f480372c70bdd852826e258) | `0` | `read_avro` |
| [Excel](https://github.com/duckdb/duckdb-excel/tree/f4c72b5ef04a03b3a78a95b5a2ee94ba93e3178d) | `0` | `read_xlsx` |
| [Postgres](https://github.com/duckdb/duckdb-postgres/tree/41223e51559cd581f1c06e170b71c71df25bbaac) | `0` | `read_postgres_binary` |
| [Vortex](https://github.com/vortex-data/duckdb-vortex/tree/2a008b1734d563f46a1ff0af3a758f4fd844ea91) | `0` | `read_vortex`, `vortex_scan` |

`copy_dir` is included because it reads its source before writing. DuckLake's
add-files function reads metadata from its third argument. Lance maintenance
functions open the dataset identified by their first argument, and
`__lance_namespace_scan` reads an HTTP endpoint. `sqlite_attach` is the legacy
table function, not the SQL `ATTACH` statement.

The path-selector review deliberately excludes nested-SQL functions; the query
policy separately rejects the known core nested-SQL table functions. It also
excludes attached-catalog functions whose arguments are catalog or table
identifiers; Postgres, MySQL, and ODBC connection-string functions; pure write
destinations; Lance functions whose arguments are only catalog identifiers; and
proprietary or unpinned extension behavior. `ducklake_scan` is excluded because
its catalog-visible argument is not used as a caller-provided path during normal
binding.

Replacement scans are a separate query AST surface. DuckDB 1.5.5 rewrites
recognized CSV/TSV, DuckDB database, Parquet, JSON, XLSX, Spatial, and Lance
paths to reader functions. A caller can also evade literal inspection through
constructed path expressions, macros, views, unreviewed nested-SQL executors,
extension-defined schemes, metadata that references remote files, or filesystem
conventions such as GDAL `/vsi*` paths. This inventory supports best-effort
hardening against common accidental or opportunistic remote scans, not a
sandbox.
