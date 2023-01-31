# Mosaic: An Extensible Architecture for Scalable Linked Data Views

Mosaic is an extensible architecture for linking data visualizations, tables, input widgets, and other data-driven components, leveraging a backing database for scalable processing of both static and interactive views. With Mosaic, you can visualize and explore millions and even billions of data points at interactive rates.

The key idea is to have interface components "publish" their data needs as declarative queries that can be managed, optimized, and cross-filtered by a coordinator that proxies access to a database such as [DuckDB](https://duckdb.org/).

This repository contains a set of related packages:

- `duckdb`: A Node.js + DuckDB data server that supports transfer of [Apache Arrow](https://arrow.apache.org/) and JSON data over either Web Sockets or HTTP.
- `sql`: An API for convenient construction and analysis of SQL queries. Query objects then coerce to SQL query strings.
- `mosaic`: The core Mosaic components. A central coordinator, signals and selections for linking values or query predicates (respectively) across Mosaic clients, and filter groups with optimized index management. Mosaic can send queries either over the network to a backing server (`socket` and `rest` clients) or to a client-side [DuckDB-WASM](https://github.com/duckdb/duckdb-wasm) instance (`wasm` client).
- `inputs`: Standalone data-driven components such as input menus, text search boxes, and sortable, load-on-scroll data tables.
- `vgplot`: A prototype visualization grammar implemented on top of [Observable Plot](https://github.com/observablehq/plot), in which marks (plot layers) are individual Mosaic clients. These marks can push data processing (binning, hex binning, regression) and optimizations (such as M4 for line/area charts) down to the database.

## Build Instructions

To build and develop Mosaic locally:

1. Clone [https://github.com/uwdata/mosaic](https://github.com/uwdata/mosaic).
2. Run `npm i` to install dependencies.
3. Run `npm test` to run the test suite.
4. Run `npm run build` to build client-side bundles.

To run the interactive examples:

1. Run `npm run server` to launch a data server with default files loaded.
2. Run `npm run dev` to launch a local web server and view examples.
