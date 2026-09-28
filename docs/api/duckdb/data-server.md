# Data Server

The data server provides network access to a server-side DuckDB instance from Node.js.
Both WebSocket (`socket`) and HTTP (`rest`) connections are supported.

::: warning
Due to persistent quality issues involving the DuckDB Node.js client and Arrow extension, we recommend using Mosaic's Python-based [`duckdb-server`](/server/) package instead. However, we retain this JavaScript-based server for both backwards compatibility and potential future use as quality issues improve.
:::

## dataServer

`dataServer(db, options)`

Launch a new data server instance.
The _db_ argument should be a [`DuckDB`](./duckdb) instance.

The following _options_ are supported:

- _port_: The port number (default `3000`) on which to listen for query requests.
- _rest_: Boolean flag (default `true`) indicating if HTTP REST connections should be enabled.
- _socket_: Boolean flag (default `true`) indicating if WebSocket connections should be enabled.
- _compression_: Boolean flag (default `true`) enabling negotiated HTTP gzip. Set to `false` for latency-sensitive local deployments that prefer uncompressed responses. This option does not enable WebSocket compression.

Once launched, the data server will accept HTTP POST requests containing JSON content that consists of a single object with the following properties:

- _type_: The type of query (required). The type `"exec"` indicates that the provided query should be run with no return value. The `"arrow"` type indicates that the result table should be returned as Arrow IPC bytes.
- _sql_: The SQL query string to issue to DuckDB.

A request without a _type_ is rejected with HTTP status 400.

Arrow HTTP responses negotiate gzip using `Accept-Encoding`, including quality
weights and explicit exclusions. Gzip is used when it is at least as preferred
as identity and the uncompressed response is at least 1 KiB; smaller responses
stay uncompressed unless identity is explicitly unacceptable. With no
`Accept-Encoding` header, responses are uncompressed. Arrow responses include
`Vary: Accept-Encoding`, and return status 406 if neither gzip nor identity is
acceptable. Compression is streamed with backpressure and uses gzip level 1 to
reduce CPU and latency overhead. With `compression: false`, only identity is
available; a request excluding identity receives status 406.
Empty `exec` responses and errors are not compressed.

### Examples

Launch a data server in Node.js:

``` js
import { DuckDB, dataServer } from "@uwdata/mosaic-duckdb";
dataServer(new DuckDB(), { rest: true, socket: true });
```
