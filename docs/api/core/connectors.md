# Connectors

Database connectors issue query requests to a backing data source.

A connector instance should expose a `query(query)` method that returns a Promise.
The _query_ argument is an object with the following properties:

- _sql_: The SQL query to evaluate.
- _type_: The query format type, either `"exec"` (no return value) or `"arrow"`. This property is required; servers reject a request without it.
- Any additional connector-specific options.

For the `"arrow"` type, a connector returns the raw Arrow IPC bytes as an `ArrowIPCBytes` value, which is an `ArrayBuffer`, a `Uint8Array`, or an array of `Uint8Array` chunks; the coordinator decodes them to an Arrow table.

Once instantiated, register a connector with the coordinator using the [`coordinator.databaseConnector()`](coordinator#databaseconnector) method.

## decodeIPC

`decodeIPC(data, options)`

Decode Arrow IPC bytes to an Arrow table. The _data_ argument is an `ArrowIPCBytes` value. The optional _options_ argument gives Arrow IPC extraction options; if unspecified, date and timestamp values are extracted as JavaScript `Date` objects. Use this to read query results directly from a connector, outside the coordinator.

## restConnector

`restConnector(options)`

Create a new HTTP rest connector to a DuckDB [data server](../duckdb/data-server) with the given _options_.

The supported options are:

- _uri_: The URI of the data server (default `"http://localhost:3000/"`).
- _headers_: Additional request headers, as a `Headers` object, a plain object, or an array of name-value pairs. Alternatively, a function that returns headers, possibly asynchronously, which is called before every request, for example to supply a refreshed access token. The `Content-Type: application/json` header is always sent.
- _fetch_: A [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) implementation to use instead of the global `fetch`. Requests otherwise use `mode: "cors"` and `credentials: "omit"`; a custom implementation can change these, for example `(input, init) => fetch(input, { ...init, credentials: 'include' })`.

```js
const connector = restConnector({
  uri: 'https://example.com/mosaic/',
  headers: async () => ({ Authorization: `Bearer ${await getToken()}` })
});
```

A data server on a different origin must allow these requests in its CORS preflight response. `Access-Control-Allow-Headers: *` covers custom headers such as `X-Api-Key`, but never `Authorization`, which a server must list by name: the Go server's command-line tool allows it, while the Python, Node.js, and Rust servers currently do not. Requests that include credentials also require the server to allow the specific origin and to send `Access-Control-Allow-Credentials: true`; a custom _fetch_ cannot provide these.

## wasmConnector

`wasmConnector(options)`

Create a new DuckDB-WASM connector with the given _options_.
This method will instantiate a new DuckDB instance in-browser using Web Assembly. If no existing DuckDB-WASM instance is provided as an option, a new instance is created lazily upon first access.

The supported options are:

- _duckdb_: An existing DuckDB-WASM instance to query. If unspecified, a new instance is created.
- _connection_: An existing connection to a DuckDB-WASM instance to use. If unspecified, a new connection is created.
- _log_: A Boolean flag (default `false`) that indicates if DuckDB-WASM logs should be written to the browser console. This option is ignored when an existing _duckdb_ instance option is provided.
