# Multi-Database Support

Mosaic uses DuckDB, which [supports multiple databases](https://duckdb.org/2024/01/26/multi-database-support-in-duckdb.html) such as MySQL, PostgreSQL, and SQLite, via [DuckDB extensions](https://duckdb.org/docs/extensions/overview.html). This capability allows data to be read into DuckDB and transferred between systems, enabling flexibile and interoperable data management.

Mosaic can take advantage of these features to visualize data stored in alternative databases. As shown in the examples below, database configuration can be performed via direct DuckDB queries. Once configured, Mosaic can be used in a normal fashion.

## Connect to PostgreSQL

``` js
import * as vg from "@uwdata/vgplot";

// database configuration info
// replace values with your specific configuration
const config = {
  dbname: "YOUR_DATABASE_NAME",
  user: "postgres",
  password: "YOUR_PASSWORD",
  host: "YOUR_HOST_IP"
};

// map configuration info to a connection string
const postgres_connection_string = Object.entries(config)
  .map([key, value] => `${key}=${value}`)
  .join(" ");

await vg.coordinator().exec([
  // attach and use a PostgreSQL database
  `ATTACH '${postgres_connection_string}' AS postgres_db (TYPE POSTGRES)`,
  "USE postgres_db",
  vg.loadParquet("ca55", "data/ca55-south.parquet") // load a dataset
]);

// create interactive visualizations for your dataset as usual!
// here we've copied the aeromagnetic-survey example...
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

## Connect to MySQL

``` js
import * as vg from "@uwdata/vgplot";

// database configuration info
// replace values with your specific configuration
const config = {
  database: "YOUR_DATABASE_NAME",
  user: "root",
  password: "YOUR_PASSWORD",
  host: "YOUR_HOST_IP",
  port: "YOUR_PORT"
};

// map configuration info to a connection string
const mysql_connection_string = Object.entries(config)
  .map([key, value] => `${key}=${value}`)
  .join(" ");

await vg.coordinator().exec([
  // attach and use a MySQL database
  `ATTACH '${mysql_connection_string}' AS mysqldb (TYPE MYSQL)`,
  "USE mysqldb",
  vg.loadParquet("ca55", "data/ca55-south.parquet") // load a dataset
]);

// now add Mosaic specification code as usual!
```

## Connect to SQLite

``` js
import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  // attach and use a SQLite database
  `ATTACH 'sakila.db' (TYPE SQLITE)`,
  "USE sakila",
  vg.loadParquet("ca55", "data/ca55-south.parquet") // load the dataset
]);

// now add Mosaic specification code as usual!
```
