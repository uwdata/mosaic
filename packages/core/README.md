# mosaic-core

The core Mosaic components. A central coordinator, signals and selections for linking values or query predicates (respectively) across Mosaic clients, and filter groups with optimized index management. Mosaic can send queries either over the network to a backing server (`socket` and `rest` clients) or to a client-side [DuckDB-WASM](https://github.com/duckdb/duckdb-wasm) instance (`wasm` client).
