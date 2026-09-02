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

## Testing ClickHouse

The ClickHouse generator has execution tests that run against the `clickhouse local` command. These tests require ClickHouse and are skipped by the normal `pnpm test` command. With the ClickHouse command-line executable installed, run:

``` sh
pnpm --filter @uwdata/mosaic-sql test:clickhouse
```

By default the tests invoke `clickhouse local`. Set `CLICKHOUSE_BIN` to use an alternate ClickHouse executable.

CI runs these tests on Linux against the ClickHouse 26.5 release line. Other local versions are allowed and may reveal version-specific compatibility differences; the CI version is not a declared minimum supported version.
