# Mosaic: An Extensible Framework for Linking Databases and Interactive Views

* 📈 **Explore massive datasets**<br/>
  Visualize, select, and filter datasets with millions or billions of records.
* 🚀 **Flexible deployment**<br/>
  Build data-driven web apps, or interact with data directly in Jupyter notebooks.
* 🛠️ **Interoperable & extensible**<br/>
  Create new components that seamlessly integrate across selections and datasets.
* 🦆 **Powered by DuckDB**<br/>
  Mosaic pushes computation to DuckDB, both server-side and in your browser via WebAssembly.

Mosaic is an extensible architecture for linking data visualizations, tables, input widgets, and other data-driven components, leveraging a backing database for scalable processing of both static and interactive views. With Mosaic, you can visualize and explore millions and even billions of data points at interactive rates.

The key idea is to have interface components "publish" their data needs as declarative queries that can be managed, optimized, and cross-filtered by a coordinator that proxies access to [DuckDB](https://duckdb.org/).

[**Learn more about Mosaic at the documentation site**](https://uwdata.github.io/mosaic/), or [read the Mosaic research paper](https://idl.cs.washington.edu/papers/mosaic).

If referencing Mosaic, please use the following citation:

```bibtex
@article{heer2024mosaic,
  title={Mosaic: An Architecture for Scalable \& Interoperable Data Views},
  author={Heer, Jeffrey and Moritz, Dominik},
  journal={IEEE Transactions on Visualization and Computer Graphics},
  year={2024},
  volume={30},
  number={1},
  pages={436-446},
  doi={10.1109/TVCG.2023.3327189}
}
```

## Repository Structure

This repository contains a set of related packages:

- [`mosaic-core`](https://github.com/uwdata/mosaic/tree/main/packages/core): The core Mosaic components. A central coordinator, parameters and selections for linking scalar values or query predicates (respectively) across Mosaic clients, and filter groups with optimized index management. The Mosaic coordinator can send queries either over the network to a backing server (`socket` and `rest` clients) or to a client-side [DuckDB-WASM](https://github.com/duckdb/duckdb-wasm) instance (`wasm` client).
- [`mosaic-duckdb`](https://github.com/uwdata/mosaic/tree/main/packages/duckdb): A Promise-based Node.js API to DuckDB, along with a data server that supports transfer of [Apache Arrow](https://arrow.apache.org/) and JSON data over either Web Sockets or HTTP.
- [`mosaic-sql`](https://github.com/uwdata/mosaic/tree/main/packages/sql): An API for convenient construction and analysis of SQL queries. Query objects then coerce to SQL query strings.
- [`mosaic-inputs`](https://github.com/uwdata/mosaic/tree/main/packages/inputs): Standalone data-driven components such as input menus, text search boxes, and sortable, load-on-scroll data tables.
- [`mosaic-plot`](https://github.com/uwdata/mosaic/tree/main/packages/plot): An interactive grammar of graphics implemented on top of [Observable Plot](https://github.com/observablehq/plot). Marks (plot layers) serve as individual Mosaic clients. These marks can push data processing (binning, hex binning, regression) and optimizations (such as M4 for line/area charts) down to the database. This package also provides interactors for linked selection, filtering, and highlighting using Mosaic Params and Selections.
- [`mosaic-spec`](https://github.com/uwdata/mosaic/tree/main/packages/spec): Declarative specification of Mosaic-powered applications. This package provides a parser and code generation framework for reading specifications in a JSON format and generating live Mosaic visualizations and dashboards using the [vgplot](https://github.com/uwdata/mosaic/tree/main/packages/vgplot) API.
- [`vgplot`](https://github.com/uwdata/mosaic/tree/main/packages/vgplot): A visualization grammar API for building interactive Mosaic-powered visualizations and dashboards. This package provides convenient, composable methods that combine multiple Mosaic packages (core, inputs, plot, etc.) in an integrated API.
- [`widget`](https://github.com/uwdata/mosaic/tree/main/packages/widget): A Jupyter widget for Mosaic. Create interactive Mosaic plots over Pandas and Polars data frames or DuckDB connections.
- [`vega-example`](https://github.com/uwdata/mosaic/tree/main/packages/vega-example): A preliminary example integrating Vega-Lite with Mosaic for data management and cross-view linking.

_Note_: For convenience, `vgplot` re-exports much of the `mosaic-core`, `mosaic-sql`, `mosaic-plot`, and `mosaic-inputs` packages. For most applications, it is sufficient to either import `@uwdata/vgplot` alone or in conjunction with `mosaic-spec`.

## Build and Usage Instructions

To build and develop Mosaic locally:

1. Clone [https://github.com/uwdata/mosaic](https://github.com/uwdata/mosaic).
2. Run `npm i` to install dependencies.
3. Run `npm test` to run the test suite.
4. Run `npm run build` to build client-side bundles.

To run local interactive examples:

1. Run `npm run server` to launch a data server with default files loaded.
2. Run `npm run dev` to launch a local web server and view examples.

To use Mosaic with DuckDB Python in Jupyter Notebooks:

* See the [Mosaic `widget` documentation](https://uwdata.github.io/mosaic/jupyter/).

To use Mosaic with DuckDB-WASM in Observable Notebooks:

* See the [Mosaic 10M Flights example](https://observablehq.com/@uwdata/mosaic-cross-filter-flights-10m).
