# Connectors

Database connectors issue query requests to a backing data source.

A connector instance should expose a `query(query)` method that returns a Promise.
The _query_ argument is an object that may include the following properties:

- _sql_: The SQL query to evaluate.
- _type_: The query format type, either `"exec"` (no return value) or `"arrow"`.
- Any additional connector-specific options.

Once instantiated, register a connector with the coordinator using the [`coordinator.databaseConnector()`](coordinator#databaseconnector) method.

## Application fields

A custom connector can attach application-owned fields to the final outgoing command:

```js
import { Coordinator, restConnector } from '@uwdata/mosaic-core';

const transport = restConnector({ uri: 'http://localhost:3000/' });
const fields = { project: 'dashboard', labels: ['interactive'] };
const connector = {
  query({ type, sql, ...options }) {
    return transport.query({ ...options, ...fields, type, sql });
  }
};
const coordinator = new Coordinator(connector);
```

The same wrapper works with `socketConnector({ uri: 'ws://localhost:3000/' })`, attaching fields to each message. The field names and JSON values in this example are application choices; Mosaic defines no metadata key or schema. Existing command fields retain their protocol meaning.

Attach fields in the connector because query consolidation can discard options passed to `coordinator.query`. The client cache is keyed by SQL and can bypass the connector entirely. If application fields change result or authorization scope, isolate coordinator/cache/consolidation state for each scope or disable the relevant reuse; changing fields on a shared connector does not partition that state.

Programs embedding the [Go server](https://github.com/uwdata/mosaic/tree/main/packages/server/duckdb-server-go#application-command-fields) choose their payload type with `Authorizer[T]` and receive it through `Command[T].Payload()`. The server decodes the complete command envelope into the application's type without choosing a metadata field or schema. Its README includes a typed Go example, payload ownership and HTTP GET behavior, and the `WithMaxMessageBytes` option.

## socketConnector

`socketConnector({ uri })`

Create a new Web Socket connector to a DuckDB [data server](../duckdb/data-server) at the given _uri_ (default `"ws://localhost:3000/"`).

## restConnector

`restConnector({ uri })`

Create a new HTTP rest connector to a DuckDB [data server](../duckdb/data-server) at the given _uri_ (default `"http://localhost:3000/"`).

## wasmConnector

`wasmConnector(options)`

Create a new DuckDB-WASM connector with the given _options_.
This method will instantiate a new DuckDB instance in-browser using Web Assembly. If no existing DuckDB-WASM instance is provided as an option, a new instance is created lazily upon first access.

The supported options are:

- _duckdb_: An existing DuckDB-WASM instance to query. If unspecified, a new instance is created.
- _connection_: An existing connection to a DuckDB-WASM instance to use. If unspecified, a new connection is created.
- _log_: A Boolean flag (default `false`) that indicates if DuckDB-WASM logs should be written to the browser console. This option is ignored when an existing _duckdb_ instance option is provided.
