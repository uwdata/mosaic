# Data Loading

SQL data loading utilities.
These methods generate queries that load data into DuckDB.

## loadExtension

`loadExtension(extensionName)`

Generates a query to install and load a named DuckDB extension. For example, `vg.loadExtension("spatial")` will load the [`spatial` extension](https://duckdb.org/docs/extensions/spatial.html).

## loadCSV

`loadCSV(tableName, file, options)`

Generate a SQL query to create a table containing the values of a CSV _file_.
The _file_ argument may be a URL or a local filesystem path (if running DuckDB locally, _not_ via WebAssembly).

The supported _options_ are:

- _select_: An optional list of column expressions to select. If not specified, all columns are included.
- _where_: An optional filter predicate (`WHERE` clause) to filter the data on load.
- _view_: A boolean flag (default `false`) indicating if a `VIEW` should be created over the file, rather than a `TABLE`.
- _temp_: A boolean flag (default `true`) indicating if the created table or view should be a temporary instance that should not persist beyond the current session.
- _replace_: A boolean flag (default `false`) indicating that the file contents should replace any existing table or view with the same name. The default behavior is to do nothing if a name conflict exists.
- Additional CSV-specific options, see the [DuckDB CSV documentation](https://duckdb.org/docs/data/csv/overview).

``` js
// Loads file.csv into the table "table1" with default options:
// CREATE TABLE IF NOT EXISTS table1 AS
//   SELECT *
//   FROM read_csv('file.csv', auto_detect=true, sample_size=-1)
loadCSV("table1", "file.csv");
```

## loadJSON

`loadJSON(tableName, file, options)`

Generate a SQL query to create a table containing the values of a JSON _file_.
The _file_ argument may be a URL or a local filesystem path (if running DuckDB locally, _not_ via WebAssembly).

The supported _options_ are:

- _select_: An optional list of column expressions to select. If not specified, all columns are included.
- _where_: An optional filter predicate (`WHERE` clause) to filter the data on load.
- _view_: A boolean flag (default `false`) indicating if a `VIEW` should be created over the file, rather than a `TABLE`.
- _temp_: A boolean flag (default `true`) indicating if the created table or view should be a temporary instance that should not persist beyond the current session.
- _replace_: A boolean flag (default `false`) indicating that the file contents should replace any existing table or view with the same name. The default behavior is to do nothing if a name conflict exists.
- Additional JSON-specific options. See the [DuckDB JSON documentation](https://duckdb.org/docs/data/json/overview).

``` js
// Loads file.json into the table "table1" with default options:
// CREATE TABLE IF NOT EXISTS table1 AS
//   SELECT *
//   FROM read_json('file.json', auto_detect=true, json_format='auto')
loadJSON("table1", "file.json");
```

## loadParquet

`loadParquet(tableName, file, options)`

Generate a SQL query to create a table containing the values of a Parquet _file_.
The _file_ argument may be a URL or a local filesystem path (if running DuckDB locally, _not_ via WebAssembly).

The supported _options_ are:

- _select_: An optional list of column expressions to select. If not specified, all columns are included.
- _where_: An optional filter predicate (`WHERE` clause) to filter the data on load.
- _view_: A boolean flag (default `false`) indicating if a `VIEW` should be created over the file, rather than a `TABLE`.
- _temp_: A boolean flag (default `true`) indicating if the created table or view should be a temporary instance that should not persist beyond the current session.
- _replace_: A boolean flag (default `false`) indicating that the file contents should replace any existing table or view with the same name. The default behavior is to do nothing if a name conflict exists.
- Additional Parquet-specific options. See the [DuckDB Parquet documentation](https://duckdb.org/docs/data/parquet/overview).

```js
// Load named columns from a parquet file, filtered upon load:
// CREATE TABLE IF NOT EXISTS table1 AS
//   SELECT foo, bar, value
//   FROM read_parquet('file.parquet')
//   WHERE value > 1
loadParquet("table1", "file.parquet", {
  select: [ "foo", "bar", "value" ],
  where: "value > 1"
});
```

## loadObjects

`loadObjects(tableName, objects, options)`

Generate a SQL query to create a table containing the values of the provided JavaScript _objects_.

The supported _options_ are:

- _select_: An optional list of column expressions to select. If not specified, all columns are included.
- _view_: A boolean flag (default `false`) indicating if a `VIEW` should be created over the file, rather than a `TABLE`.
- _temp_: A boolean flag (default `true`) indicating if the created table or view should be a temporary instance that should not persist beyond the current session.
- _replace_: A boolean flag (default `false`) indicating that the file contents should replace any existing table or view with the same name. The default behavior is to do nothing if a name conflict exists.

``` js
// CREATE TABLE IF NOT EXISTS table3 AS
//   (SELECT 1 AS "foo", 2 AS "bar") UNION ALL
//   (SELECT 3 AS "foo", 4 AS "bar") UNION ALL ...
const q = loadObjects("table3", [
  { foo: 1, bar: 2 },
  { foo: 3, bar: 4 },
  ...
]);
```

## loadSpatial

`loadSpatial(tableName, file, options)`

Generate a SQL query to create a table containing the values of a spatial data file by calling the [`ST_Read` function](https://duckdb.org/docs/extensions/spatial.html#st_read---read-spatial-data-from-files) of the DuckDB `spatial` extension.
The _file_ argument may be a URL or a local filesystem path (if running DuckDB locally, _not_ via WebAssembly).

The supported _options_ are:

- _select_: An optional list of column expressions to select. If not specified, all columns are included.
- _where_: An optional filter predicate (`WHERE` clause) to filter the data on load.
- _view_: A boolean flag (default `false`) indicating if a `VIEW` should be created over the file, rather than a `TABLE`.
- _temp_: A boolean flag (default `true`) indicating if the created table or view should be a temporary instance that should not persist beyond the current session.
- _replace_: A boolean flag (default `false`) indicating that the file contents should replace any existing table or view with the same name. The default behavior is to do nothing if a name conflict exists.
- _layer_: The layer to extract from a multi-layer file. For example, for TopoJSON data this indicates which named object to extract.
- Additional spatial-specific options. See the [DuckDB spatial documentation](https://duckdb.org/docs/extensions/spatial.html).

``` js
// Loads us-states.json into the table "table1":
// CREATE TABLE IF NOT EXISTS table1 AS
//   SELECT *
//   FROM st_read('us-states.json', layer="states")
loadSpatial("table1", "us-states.json", "states");
```
