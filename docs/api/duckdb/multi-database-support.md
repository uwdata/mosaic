# Connect DuckDB to other Databases: 

Mosaic utilizes DuckDB, which [can supports multiple databases](https://duckdb.org/2024/01/26/multi-database-support-in-duckdb.html) such as MySQL, PostgreSQL, and SQLite, by using [DuckDB extensions](https://duckdb.org/docs/extensions/overview.html). This capability allows data to be seamlessly read into DuckDB and transferred between systems, enhancing flexibility and interoperability in data management.

## Examples:
### Connecting to `PostgreSQL`:

``` js
import { vg, clear } from "http://localhost:5173/dev/setup.js";

clear();

const password = "YOUR_PASSWORD";

const postgres_connection_string = `dbname=postgres user=postgres password=${password} host=127.0.0.1`;

await vg.coordinator().exec([
  "INSTALL postgres;",   // Install the postgres extension 
  "LOAD postgres;",   // Load postgres extension manually, 
  `ATTACH '${postgres_connection_string}' AS postgres_db (TYPE POSTGRES);`,   // Attach PostgreSQL databases
  "SET search_path TO postgres_db;",   // Set the schema search path for the current session
  vg.loadParquet("ca55", "http://localhost:5173/data/ca55-south.parquet"),   // Load the dataset into the PostgreSQL database
]);

// create interactive visualizations for your dataset
const $interp = vg.Param.value("random-walk");
const $blur = vg.Param.value(0);

export default vg.vconcat(
  vg.hconcat(
    vg.menu({
      label: "Interpolation Method",
      options: ["none", "nearest", "barycentric", "random-walk"],
      as: $interp
    }),
    vg.hspace("1em"),
    vg.slider({label: "Blur", min: 0, max: 100, as: $blur})
  ),
  vg.vspace("1em"),
  vg.plot(
    vg.raster(
      vg.from("ca55"),
      {
        x: "LONGITUDE",
        y: "LATITUDE",
        fill: vg.max("MAG_IGRF90"),
        interpolate: $interp,
        bandwidth: $blur
      }
    ),
    vg.colorScale("diverging"),
    vg.colorDomain(vg.Fixed)
  )
);

```


### Connecting to `MySQL`:

``` js
import { vg, clear } from "http://localhost:5173/dev/setup.js";

clear();

const password = "YOUR_PASSWORD";

const databaseName = "YOUR_DATABASE_NAME";

const mysql_connection_string = `host=localhost password=${password} user=root port=0 database=${databaseName}`;

await vg.coordinator().exec([
  "INSTALL mysql;",   // Install MySQL extension
  "LOAD mysql;",   // Manually load MySQL extension
  `ATTACH '${mysql_connection_string}' AS mysqldb (TYPE MYSQL);`,   // Attach the MySQL database
  "USE mysqldb;",   // Specify the database name
  vg.loadParquet("ca55", "http://localhost:5173/data/ca55-south.parquet"),   // Load the dataset into the MySQL database
]);

// Create interactive visualizations for your dataset
const $interp = vg.Param.value("random-walk");
const $blur = vg.Param.value(0);

export default vg.vconcat(
  vg.hconcat(
    vg.menu({
      label: "Interpolation Method",
      options: ["none", "nearest", "barycentric", "random-walk"],
      as: $interp
    }),
    vg.hspace("1em"),
    vg.slider({label: "Blur", min: 0, max: 100, as: $blur})
  ),
  vg.vspace("1em"),
  vg.plot(
    vg.raster(
      vg.from("ca55"),
      {
        x: "LONGITUDE",
        y: "LATITUDE",
        fill: vg.max("MAG_IGRF90"),
        interpolate: $interp,
        bandwidth: $blur
      }
    ),
    vg.colorScale("diverging"),
    vg.colorDomain(vg.Fixed)
  )
);
```

### Connecting to `SQLite`:

``` js
import { vg, clear } from "http://localhost:5173/dev/setup.js";

clear();

await vg.coordinator().exec([
  "INSTALL sqlite;",   // Install SQLite extension
  "LOAD sqlite;",   // Load SQLite extension
  `ATTACH 'sakila.db' (TYPE SQLITE);`,   // Attach SQLite database
  "USE sakila;",   // Switch to the database called sakila
  vg.loadParquet("ca55", "http://localhost:5173/data/ca55-south.parquet"), // Load the dataset into the SQLite database
]);

// Create interactive visualizations for your dataset
const $interp = vg.Param.value("random-walk");
const $blur = vg.Param.value(0);

export default vg.vconcat(
  vg.hconcat(
    vg.menu({
      label: "Interpolation Method",
      options: ["none", "nearest", "barycentric", "random-walk"],
      as: $interp
    }),
    vg.hspace("1em"),
    vg.slider({label: "Blur", min: 0, max: 100, as: $blur})
  ),
  vg.vspace("1em"),
  vg.plot(
    vg.raster(
      vg.from("ca55"),
      {
        x: "LONGITUDE",
        y: "LATITUDE",
        fill: vg.max("MAG_IGRF90"),
        interpolate: $interp,
        bandwidth: $blur
      }
    ),
    vg.colorScale("diverging"),
    vg.colorDomain(vg.Fixed)
  )
);
```
