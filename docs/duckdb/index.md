# Mosaic DuckDB

The Mosaic `duckdb` package provides facilities for running DuckDB from node.js and handling query requests over a network connection.

## DuckDB API

The DuckDB class is a Promise-based node.js API for interfacing with DuckDB,
providing a convenient way to launch a server-side DuckDB instance.
As illustrated in the snippet below, DuckDB queries can return either JavaScript objects or [Apache Arrow buffers](https://arrow.apache.org/).

``` js
import { DuckDB } from "@uwdata/mosaic-duckdb";

// create an in-memory DuckDB instance
// to open a database file, pass the path as the first argument
const db = new DuckDB();

// execute a query without a returned result, await completion
await db.exec(`CREATE TABLE myTable AS SELECT * FROM 'my-data.parquet'`);

// query for data, return as an array of JavaScript objects
const res = await db.query(`SELECT COUNT(*) FROM myTable`);

// query for data, return as a binary Apache Arrow buffer
const buf = await db.arrowBuffer(`SELECT AVG(value) FROM myTable`);

// shut down the DuckDB instance
db.close();
```

## Data Server

The data server provides network access to a server-side DuckDB instance.
Both WebSocket (`socket`) and HTTP (`rest`) connections are supported.
The following snippet launches a data server in node.js:

``` js
import { DuckDB, dataServer } from "@uwdata/mosaic-duckdb";
dataServer(new DuckDB(), { rest: true, socket: true });
```

By default the server listens to port 3000.
If the coordinator sends a request to persist a result, the data server will cache the results to the local filesystem.
The default cache folder is `.mosaic/cache`, relative to the current working directory.

Unless provided with an explicit web URL (`http://...`), queries that load files (e.g., CSV, JSON, or Parquet) will do so relative to the current working directory.
