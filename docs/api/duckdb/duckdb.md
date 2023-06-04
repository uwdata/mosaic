# DuckDB API

The `DuckDB` class is a Promise-based Node.js API for interfacing with DuckDB,
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

Unless provided with an explicit web URL (`http://...`), queries that load files (e.g., CSV, JSON, or Parquet) will do so relative to the current working directory.

## constructor

`new DuckDB(path)`

Create a new local DuckDB instance.
The optional _path_ argument indicates a database file path to load.
If omitted, a memory-only database instance is constructed.

## close

`db.close()`

Close the current database connection.
After closing, no more queries can be issued.

## exec

`db.exec(sql)`

Execute the provided _sql_ query and return a Promise that resolves when query evaluation completes.

## query

`db.query(sql)`

Execute the provided _sql_ query and return a Promise that resolves to the query result table as an array of JavaScript objects.

## arrowBuffer

`db.arrowBuffer(sql)`

Execute the provided _sql_ query and return a Promise that resolves to the query result table as binary data in the [streaming Apache Arrow IPC format](https://arrow.apache.org/).

## prepare

`db.prepare(sql)`

Return a new prepared statement for the given _sql_ query, which may contain `?` wildcard characters.
The resulting prepared statement instance exposes `exec(params)`, `query(params)` and `arrowBuffer(params)` methods that accept parameter values for query wildcards.
