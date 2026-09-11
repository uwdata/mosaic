# Connectors

Database connectors issue query requests to a backing data source.

A connector instance should expose a `query(query)` method that returns a Promise.
The _query_ argument is an object that may include the following properties:

- _sql_: The SQL query to evaluate.
- _type_: The query format type, either `"exec"` (no return value), `"arrow"`, or `"preagg"`.
- Any additional connector-specific options.

A `"preagg"` request asks the connector to materialize the given SELECT query and resolves to the resulting table name as `{ catalog, schema, table, createdAt }`. All bundled connectors support it: `restConnector` and `socketConnector` delegate to the server, while `wasmConnector` and `NodeConnector` create a temporary table on their own connection.

Once instantiated, register a connector with the coordinator using the [`coordinator.databaseConnector()`](coordinator#databaseconnector) method.

## socketConnector

`socketConnector(uri)`

Create a new Web Socket connector to a DuckDB [data server](../duckdb/data-server) at the given _uri_ (default `"ws://localhost:3000/"`).

`preagg` requires a supporting server. SELECT and `preagg` failures preserve structured error codes and missing-table references as `ConnectorError` instances. Responses follow request order, so a build delays later requests on the same socket.

## restConnector

`restConnector(uri)`

Create a new HTTP rest connector to a DuckDB [data server](../duckdb/data-server) at the given _uri_ (default `"http://localhost:3000/"`).

SELECT and `preagg` requests preserve structured JSON failures as a `ConnectorError` with `message`, `code`, and HTTP `status`, plus the table reference when supplied for `table_not_found`.

## wasmConnector

`wasmConnector(options)`

Create a new DuckDB-WASM connector with the given _options_.
This method will instantiate a new DuckDB instance in-browser using Web Assembly. If no existing DuckDB-WASM instance is provided as an option, a new instance is created lazily upon first access.

The supported options are:

- _duckdb_: An existing DuckDB-WASM instance to query. If unspecified, a new instance is created.
- _connection_: An existing connection to a DuckDB-WASM instance to use. If unspecified, a new connection is created.
- _log_: A Boolean flag (default `false`) that indicates if DuckDB-WASM logs should be written to the browser console. This option is ignored when an existing _duckdb_ instance option is provided.
