# Connect DuckDB to other Databases: 

Mosaic utilizes DuckDB, which [can supports multiple databases](https://duckdb.org/2024/01/26/multi-database-support-in-duckdb.html) such as MySQL, PostgreSQL, and SQLite, by using [DuckDB extensions](https://duckdb.org/docs/extensions/overview.html). This capability allows data to be seamlessly read into DuckDB and transferred between systems, enhancing flexibility and interoperability in data management.

## Examples:
### Connecting to `PostgreSQL`:

``` js
import * as vg from "@uwdata/vgplot";

const postgres_connection_string = `dbname=YOUR_DATABASE_NAME user=postgres password=YOUR_PASSWORD host=YOUR_HOST_IP`;

await vg.coordinator().exec([
  `ATTACH '${postgres_connection_string}' AS postgres_db (TYPE POSTGRES)`,   // Attach PostgreSQL databases
  "USE postgres_db",   // Select the attach PostgreSQL database
  vg.loadParquet("ca55", "data/ca55-south.parquet")   // Load the dataset into the PostgreSQL database
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


### Connecting to `MySQL`:

``` js
import * as vg from "@uwdata/vgplot";

const mysql_connection_string = `host=YOUR_HOST_IP password=YOUR_PASSWORD user=root port=YOUR_PORT database=YOUR_DATABASE_NAME`;

await vg.coordinator().exec([
  `ATTACH '${mysql_connection_string}' AS mysqldb (TYPE MYSQL)`,   // Attach the MySQL database
  "USE mysqldb",   // Specify the database name
  vg.loadParquet("ca55", "data/ca55-south.parquet")   // Load the dataset into the MySQL database
]);

// Mosaic specification goes here.
```

### Connecting to `SQLite`:

``` js
import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  `ATTACH 'sakila.db' (TYPE SQLITE)`,   // Attach SQLite database
  "USE sakila",   // Switch to the database called sakila
  vg.loadParquet("ca55", "data/ca55-south.parquet")   // Load the dataset into the SQLite database
]);

// Mosaic specification goes here
```
