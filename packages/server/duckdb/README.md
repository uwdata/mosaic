# mosaic-duckdb

[![npm version](https://img.shields.io/npm/v/@uwdata/mosaic-duckdb.svg)](https://www.npmjs.com/package/@uwdata/mosaic-duckdb)

A Promise-based Node.js API to DuckDB, along with a data server that supports transfer of [Apache Arrow](https://arrow.apache.org/) and JSON data over either Web Sockets or HTTP.

_Warning_: Due to persistent quality issues involving the Node.js DuckDB client and Arrow extension, we recommend using the Python-based [`duckdb-server`](https://github.com/uwdata/mosaic/tree/main/packages/duckdb-server) package instead. However, we retain this package for both backwards compatibility and potential future use as quality issues improve.

_Note:_ This package provides a local DuckDB server for Node.js. To instead use DuckDB-WASM in the browser, use the `wasmConnector` in the [`mosaic-core`](https://github.com/uwdata/mosaic/tree/main/packages/mosaic-core) package.