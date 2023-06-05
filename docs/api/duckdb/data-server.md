# Data Server

The data server provides network access to a server-side DuckDB instance.
Both WebSocket (`socket`) and HTTP (`rest`) connections are supported.

## dataServer

`dataServer(db, options)`

Launch a new data server instance.
The _db_ argument should be a [`DuckDB`](./duckdb) instance.

The following _options_ are supported:

- _port_: The port number (default `3000`) on which to listen for query requests.
- _rest_: Boolean flag (default `true`) indicating if HTTP REST connections should be enabled.
- _socket_: Boolean flag (default `true`) indicating if WebSocket connections should be enabled.
- _cache_: Boolean flag (default `true`) indicating if server-side caching should be enabled. Incoming queries may include a `persist` flag to request server-side caching of the result. The default cache folder is `.mosaic/cache`, relative to the current working directory.

Once launched, the data server will accept HTTP POST requests containing JSON content that consists of a single object with the following properties:

- _type_: The type of query. The type `"exec"` indicates that the provided query should be run with no return value. The `"arrow"` and `"json"` types indicate that a result table should be returned in the corresponding format.
- _sql_: The SQL query string to issue to DuckDB.
- _persist_: A Boolean flag (default `false`) indicating if the query result should be cached on the server's local file system.

### Examples

Launch a data server in Node.js:

``` js
import { DuckDB, dataServer } from "@uwdata/mosaic-duckdb";
dataServer(new DuckDB(), { rest: true, socket: true });
```
