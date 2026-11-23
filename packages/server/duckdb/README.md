# mosaic-duckdb

[![npm version](https://img.shields.io/npm/v/@uwdata/mosaic-duckdb.svg)](https://www.npmjs.com/package/@uwdata/mosaic-duckdb)

For shared localhost HTTPS/HTTP/2 setup, install native mkcert on `PATH`, then run `pnpm mkcert` from the repository root. See the [server guide](../README.md) for certificate locations, overrides, and renewal.

A Promise-based Node.js API to DuckDB, along with a data server that supports transfer of [Apache Arrow](https://arrow.apache.org/) data over HTTP.

_Note:_ This package provides a local DuckDB server for Node.js. To instead use DuckDB-WASM in the browser, use the `wasmConnector` in the [`mosaic-core`](https://github.com/uwdata/mosaic/tree/main/packages/mosaic/mosaic-core) package.
