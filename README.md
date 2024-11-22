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

[**Learn more about Mosaic at the documentation site**](https://idl.uw.edu/mosaic/), or [read the Mosaic research paper](https://idl.uw.edu/papers/mosaic).

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

This repository contains a set of related packages.

_Note_: For convenience, the `vgplot` package re-exports much of the `mosaic-core`, `mosaic-sql`, `mosaic-plot`, and `mosaic-inputs` packages. For most applications, it is sufficient to either import `@uwdata/vgplot` alone or in conjunction with `@uwdata/mosaic-spec`.

### Core Components

- [`mosaic-core`](https://github.com/uwdata/mosaic/tree/main/packages/core): The core Mosaic components. A central coordinator, parameters and selections for linking scalar values or query predicates (respectively) across Mosaic clients, and filter groups with materialized views of pre-aggregated data. The Mosaic coordinator can send queries either over the network to a backing server (`socket` and `rest` clients) or to a client-side [DuckDB-WASM](https://github.com/duckdb/duckdb-wasm) instance (`wasm` client).
- [`mosaic-sql`](https://github.com/uwdata/mosaic/tree/main/packages/sql): An API for convenient construction and analysis of SQL queries. Query objects then coerce to SQL query strings.
- [`mosaic-inputs`](https://github.com/uwdata/mosaic/tree/main/packages/inputs): Standalone data-driven components such as input menus, text search boxes, and sortable, load-on-scroll data tables.
- [`mosaic-plot`](https://github.com/uwdata/mosaic/tree/main/packages/plot): An interactive grammar of graphics implemented on top of [Observable Plot](https://github.com/observablehq/plot). Marks (plot layers) serve as individual Mosaic clients. These marks can push data processing (binning, hex binning, regression) and optimizations (such as M4 for line/area charts) down to the database. This package also provides interactors for linked selection, filtering, and highlighting using Mosaic Params and Selections.

### Applications

* [`vgplot`](https://github.com/uwdata/mosaic/tree/main/packages/vgplot): A visualization grammar API for building interactive Mosaic-powered visualizations and dashboards. This package provides convenient, composable methods that combine multiple Mosaic packages (core, inputs, plot, etc.) in an integrated API. This API re-exports much of the `mosaic-core`, `mosaic-sql`, `mosaic-plot`, and `mosaic-inputs` packages, enabling use in a stand-alone fashion.
* [`mosaic-spec`](https://github.com/uwdata/mosaic/tree/main/packages/spec): Declarative specification of Mosaic-powered applications as JSON or YAML files. This package provides a parser and code generation framework for reading specifications in a JSON format and generating live Mosaic visualizations and dashboards using the [vgplot](https://github.com/uwdata/mosaic/tree/main/packages/vgplot) API.
* [`duckdb-server`](https://github.com/uwdata/mosaic/tree/main/packages/duckdb-server): A Python-based server that runs a local DuckDB instance and support queries over Web Sockets or HTTP, returning data in either [Apache Arrow](https://arrow.apache.org/) or JSON format.
* [`widget`](https://github.com/uwdata/mosaic/tree/main/packages/widget): A Jupyter widget for Mosaic. Given a declarative specification, will generate web-based visualizations while leveraging DuckDB in the Jupyter kernel. Create interactive Mosaic plots over Pandas and Polars data frames or DuckDB connections.

### Miscellaneous

* [`mosaic-duckdb`](https://github.com/uwdata/mosaic/tree/main/packages/duckdb): A Promise-based Node.js API to DuckDB, along with a data server that supports transfer of [Apache Arrow](https://arrow.apache.org/) and JSON data over either Web Sockets or HTTP. Due to persistent quality issues involving the Node.js DuckDB client and Arrow extension, we recommend using the Python-based `duckdb-server` package instead. However, we retain this package for both backwards compatibility and potential future use as quality issues improve.
* [`duckdb-server-rust`](https://github.com/uwdata/mosaic/tree/main/packages/duckdb-server-rust): A Rust-based server similar to `duckdb-server` (Python) and `mosaic-duckdb` (Node.js) with additional support for HTTP/2. We are still evaluating what server component works best. DuckDB support for Rust is often delayed compared to Python.
* [`vega-example`](https://github.com/uwdata/mosaic/tree/main/packages/vega-example): A proof-of-concept example integrating Vega-Lite with Mosaic for data management and cross-view linking.

## Build and Usage Instructions

To build and develop Mosaic locally:

* Clone [https://github.com/uwdata/mosaic](https://github.com/uwdata/mosaic).
* Run `npm i` to install dependencies.
* Run `npm test` to run the test suite.
* Run `npm run build` to build client-side bundles.
* Run `uv build --all-packages` to build the Python packages.

To run local interactive examples:

* Run `npm run dev` to launch a local web server and view examples. By default, the examples use DuckDB-WASM in the browser. For greater performance, launch and connect to a local DuckDB server as described below below.

To launch a local DuckDB server:

* Install [uv](https://docs.astral.sh/uv/), if not already present.
* Run `npm run server` to launch the [`duckdb-server`](https://github.com/uwdata/mosaic/tree/main/packages/duckdb-server). This runs the server in development mode, so the server will restart if you change its code.

To use Mosaic with DuckDB Python in Jupyter Notebooks:

* See the [Mosaic `widget` documentation](https://idl.uw.edu/mosaic/jupyter/).

To use Mosaic with DuckDB-WASM in Observable Notebooks:

* See the [Mosaic 10M Flights example](https://observablehq.com/@uwdata/mosaic-cross-filter-flights-10m).

To use Mosaic and DuckDB in Observable Framework:

* See the [Mosaic + Framework example site](https://github.com/uwdata/mosaic-framework-example).
