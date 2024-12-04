# mosaic-core

[![npm version](https://img.shields.io/npm/v/@uwdata/mosaic-core.svg)](https://www.npmjs.com/package/@uwdata/mosaic-core)

The core Mosaic components: a central coordinator, parameters (`Param`) and selections (`Selection`) for linking scalar values or query predicates (respectively) across Mosaic clients, and filter groups with materialized views of pre-aggregated data. The Mosaic coordinator can send queries either over the network to a backing server (`socket` and `rest` clients) or to a client-side [DuckDB-WASM](https://github.com/duckdb/duckdb-wasm) instance (`wasm` client).

The `mosaic-core` facilities are included as part of the [vgplot](https://github.com/uwdata/mosaic/tree/main/packages/vgplot) API.
