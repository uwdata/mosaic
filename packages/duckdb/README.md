# mosaic-duckdb

A Promise-based Node.js API to DuckDB, along with a data server that supports transfer of [Apache Arrow](https://arrow.apache.org/) and JSON data over either Web Sockets or HTTP.

_Note:_ This package provides a local DuckDB server for Node.js. To instead use DuckDB-WASM in the browser, use the `wasmConnector` in the [`mosaic-core`](https://github.com/uwdata/mosaic/tree/main/packages/mosaic-core) package.