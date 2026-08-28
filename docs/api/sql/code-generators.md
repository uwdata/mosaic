# Code Generators

Mosaic SQL abstract syntax trees can be rendered for different SQL dialects using a code generator.
The package provides generators for DuckDB and partial ClickHouse support.

## Built-in Generators

The following classes are exported from `@uwdata/mosaic-sql`:

- `SQLCodeGenerator`: Abstract base class for SQL code generators.
- `DuckDBCodeGenerator`: DuckDB code generator class.
- `ClickHouseCodeGenerator`: ClickHouse code generator class.

DuckDB is the default. Pass a generator to a node's `toString` method to render another dialect:

``` js
import { Query, clickHouseCodeGenerator } from "@uwdata/mosaic-sql";

const query = Query.select("value").from("table");
query.toString(clickHouseCodeGenerator);
```

To use a generator for queries issued by a coordinator, provide the `codegen` option:

``` js
import { Coordinator } from "@uwdata/mosaic-core";
import { clickHouseCodeGenerator } from "@uwdata/mosaic-sql";

const coordinator = new Coordinator(connector, {
  codegen: clickHouseCodeGenerator
});
```
