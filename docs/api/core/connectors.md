# Connectors

Database connectors issue query requests to a backing data source.

A connector instance should expose a `query(query)` method that returns a Promise.
The _query_ argument is an object that may include the following properties:

- _sql_: The SQL query to evaluate.
- _type_: The query format type, either `"exec"` (no return value), `"arrow"`, or `"preagg"` (see below).
- Any additional connector-specific options.

Once instantiated, register a connector with the coordinator using the [`coordinator.databaseConnector()`](coordinator#databaseconnector) method.

## Pre-aggregation commands

Connectors used with the `preagg: { mode: 'preagg' }` [coordinator option](coordinator#constructor) must transport one additional request type. Of the bundled connectors only `RestConnector` supports it; `socketConnector`, `wasmConnector`, and the Node connector reject it with an `unsupported_command` error.

A `preagg` request asks the server to materialize a single SELECT statement. The server validates the SQL, chooses the destination, and returns its fully qualified name:

``` json
// request
{ "type": "preagg", "sql": "SELECT category, count(*) AS n FROM analytics.events GROUP BY category" }

// response
{ "catalog": "memory", "schema": "mosaic_scope_a7", "table": "preagg_c92f", "createdAt": "2026-09-08T20:00:00Z" }
```

The coordinator never sends a drop or release request; the server is responsible for bounding and reclaiming the tables it creates.

Failures for this command reject with a `ConnectorError`. Servers report structured errors as a JSON object with an `error` message and a stable `code`; `table_not_found` errors also carry `catalog`, `schema`, and `table`. For REST connectors the HTTP status is available as `status`, and non-JSON error bodies produce a generic `ConnectorError` whose message is the response body. Ordinary `arrow` and `exec` requests keep their existing error behavior.

REST `preagg` requests send `Accept: application/json`.

## socketConnector

`socketConnector(uri)`

Create a new Web Socket connector to a DuckDB [data server](../duckdb/data-server) at the given _uri_ (default `"ws://localhost:3000/"`).

## restConnector

`restConnector(uri)`

Create a new HTTP rest connector to a DuckDB [data server](../duckdb/data-server) at the given _uri_ (default `"http://localhost:3000/"`).

## wasmConnector

`wasmConnector(options)`

Create a new DuckDB-WASM connector with the given _options_.
This method will instantiate a new DuckDB instance in-browser using Web Assembly. If no existing DuckDB-WASM instance is provided as an option, a new instance is created lazily upon first access.

The supported options are:

- _duckdb_: An existing DuckDB-WASM instance to query. If unspecified, a new instance is created.
- _connection_: An existing connection to a DuckDB-WASM instance to use. If unspecified, a new connection is created.
- _log_: A Boolean flag (default `false`) that indicates if DuckDB-WASM logs should be written to the browser console. This option is ignored when an existing _duckdb_ instance option is provided.
