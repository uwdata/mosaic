# Connectors

Database connectors issue query requests to a backing data source.

A connector instance should expose a `query(query)` method that returns a Promise.
The _query_ argument is an object with the following properties:

- _sql_: The SQL query to evaluate.
- _type_: The query format type, either `"exec"` (no return value), `"arrow"`, or `"preagg"`. This property is required; servers reject a request without it.
- Any additional connector-specific options.

For the `"arrow"` type, a connector returns the raw Arrow IPC bytes as an `ArrowIPCBytes` value, which is an `ArrayBuffer`, a `Uint8Array`, or an array of `Uint8Array` chunks; the coordinator decodes them to an Arrow table.

A `"preagg"` request asks the connector to materialize the given SELECT query and resolves to `{ reference, createdAt }`, where `reference` is `{ catalog, schema, table }` with `schema` a namespace path (outermost first), plus optional informational `rows` and `bytes` when the server reports them. The coordinator queries `TableRefNode([catalog, ...schema, table])`.

Once instantiated, register a connector with the coordinator using the [`coordinator.databaseConnector()`](coordinator#databaseconnector) method.

## decodeIPC

`decodeIPC(data, options)`

Decode Arrow IPC bytes to an Arrow table. The _data_ argument is an `ArrowIPCBytes` value. The optional _options_ argument gives Arrow IPC extraction options; if unspecified, date and timestamp values are extracted as JavaScript `Date` objects. Use this to read query results directly from a connector, outside the coordinator.

## restConnector

`restConnector(uri)`

Create a new HTTP rest connector to a DuckDB [data server](../duckdb/data-server) at the given _uri_ (default `"http://localhost:3000/"`).

Failed requests reject with a [`ConnectorError`](#connectorerror) carrying the HTTP `status`. A JSON error envelope from the server also supplies `code` and, for `table_not_found`, `reference`.

## wasmConnector

`wasmConnector(options)`

Create a new DuckDB-WASM connector with the given _options_.
This method will instantiate a new DuckDB instance in-browser using Web Assembly. If no existing DuckDB-WASM instance is provided as an option, a new instance is created lazily upon first access.

The supported options are:

- _duckdb_: An existing DuckDB-WASM instance to query. If unspecified, a new instance is created.
- _connection_: An existing connection to a DuckDB-WASM instance to use. If unspecified, a new connection is created.
- _log_: A Boolean flag (default `false`) that indicates if DuckDB-WASM logs should be written to the browser console. This option is ignored when an existing _duckdb_ instance option is provided.

## ConnectorError

`new ConnectorError(message, fields)`

The error a connector rejects with when a request fails. The optional _fields_ object may provide `code`, `status`, `reference`, and `cause`, which are exposed as instance properties:

- _code_: A machine-readable failure class. Known values are exported as the `ConnectorErrorCode` constants, for example `ConnectorErrorCode.TableNotFound` (`"table_not_found"`); treat any other value as a generic failure.
- _status_: The HTTP status code, for requests made over HTTP.
- _reference_: The `{ catalog, schema, table }` reference of a missing managed table. Present only for `table_not_found`, where the coordinator uses it to rebuild the table.
- _cause_: The underlying error, when the failure wraps one.

The codes a server may report are `bad_request`, `unauthenticated`, `forbidden`, `table_not_found`, `unsupported_command`, `resource_exhausted`, `deadline_exceeded`, and `internal_error`. The coordinator itself raises `malformed_response` for a `preagg` response it cannot parse, `lane_busy` when too many pre-aggregation builds are already pending, `suppressed` while a recent failure for the same query cools down, and `deadline_exceeded` when a build exceeds its timeout.
