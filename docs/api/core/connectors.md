# Connectors

Database connectors that a [`coordinator`](./coordinator) uses to issue requests to a backing data source.

## socketConnector

`socketConnector(uri)`

Create a new Web Socket connector to a DuckDB [data server](../duckdb/data-server) at the given _uri_ (default `"http://localhost:3000/"`).


## restConnector

`restConnector(uri)`

Create a new HTTP rest connector to a DuckDB [data server](../duckdb/data-server) at the given _uri_ (default `"ws://localhost:3000/"`).

## wasmConnector

`wasmConnector(options)`

Create a new DuckDB-WASM connector with the given _options_.
This method will instantiate a new DuckDB instance in-browser using Web Assembly.

The supported options are:

- _log_: A Boolean flag (default `false`) that indicates if DuckDB-WASM logs should be written to the browser console.
