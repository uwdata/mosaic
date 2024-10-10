# Mosaic SQL

The Mosaic `sql` package supports authoring of SQL queries.
These utilities are used throughout Mosaic packages to build structured queries and perform query analysis.

## Query

Use the `Query` class to build complete SQL queries.
Upon string coercion, the resulting object produces a query string.

``` js
import { Query } from "@uwdata/mosaic-sql";

// SELECT foo AS a, bar AS b FROM table
Query.from("table").select({ a: "foo", b: "bar" })
```

The `Query` class supports a rich set of SQL features, including subqueries (by passing queries as arguments to `from()`) and [common table expressions](https://duckdb.org/docs/sql/query_syntax/with.html) (via the `with()` method). Here is a run down of the available methods:

``` js
Query
  .with(/* a map of named common table expression queries */)
  .select(/* column names or name -> expression maps */)
  .distinct(/* boolean to denote distinct values only */)
  .from(/* source table names or subqueries */)
  .sample(/* number of rows or % to sample */)
  .where(/* filter criteria */)
  .groupby(/* columns or expressions to group by */)
  .having(/* post-aggregation filter criteria */)
  .window(/* named window definitions */)
  .qualify(/* post-window filter criteria */)
  .orderby(/* columns or expressions to sort by */)
  .limit(/* max number of rows */)
  .offset(/* offset number of rows */)
```

[Query API Reference](/api/sql/queries)

## SQL Expressions

The `sql` template literal builds individual SQL expressions.

``` js
import { Query, sql } from "@uwdata/mosaic-sql";
Query
  .select({ logFoo: sql`log(foo + 1)` })
  .from("myTable");
```

Interpolated values may include column references, nested expressions, or params.
The resulting expression will keep track of referenced columns.
Expressions that contain a [`Param`](/core/#params) will listen for updates and act like params of their own, including support for `value` event listeners:

``` js
import { Param } from "@uwdata/core";
import { column, sql } from "@uwdata/mosaic-sql";

const col = column("foo");
const param = Param.value(Math.PI);
const expr = sql`${col} * ${param}`;

expr.addEventListener("value", v => console.log("Update!", v));
param.update(Math.E); // --> expr will invoke value listeners
```

The `agg` template literal is similar to `sql`, but additionally flags the result as an aggregate expression.
This annotation can guide query construction and analysis.

``` js
import { Query, agg, column } from "@uwdata/mosaic-sql";
const foo = column("foo");
const bar = column("bar");
Query
  .from("myTable")
  .select({ hi: agg`GREATEST(MAX(${foo}), MAX(${bar}))` });
```

[Expression API Reference](/api/sql/expressions)

## Operators

The Mosaic SQL package includes operators for comparing values:

- Logical operators: `and`, `or`, `not`
- Comparison operators: `eq`, `neq`, `lt`, `gt`, `lte`, `gte`
- Range operators: `isBetween`, `isNotBetween`
- Null checks: `isNull`, `isNotNull`
- Null-sensitive comparison: `isDistinct`, `isNotDistinct`

For example, to create a simple range query:

``` js
import { Query, and, count, isBetween } from "@uwdata/mosaic-sql";
Query
  .from("myTable")
  .select({ count: count() })
  .where(and(isBetween("foo", [10, 50]), isBetween("bar", [-5, 10])))
```

[Operator API Reference](/api/sql/operators)

## Aggregate Functions

DuckDB-supported [aggregate functions](https://duckdb.org/docs/sql/aggregates.html), including `min`, `max`, `count`, `sum`, `avg`, `stddev`, `median`, `quantile`, `argmax`, and `argmin`.

``` js
import { Query, max, min, quantile } from "@uwdata/mosaic-sql";

// get min/max, median, and interquartile range
Query.select({
  min: min("foo"),
  q25: quantile("foo", 0.25),
  q50: quantile("foo", 0.50),
  q75: quantile("foo", 0.75),
  max: max("foo"),
}).from("myTable");
```

[Aggregate Functions API Reference](/api/sql/aggregate-functions)

## Window Functions

General purpose [window functions](https://duckdb.org/docs/sql/window_functions) include `row_number`, `rank`, `cume_dist`, `lag`, `lead`, _etc_.
Aggregate functions become window operations (such as cumulative sums or moving averages) if you define the parameters `orderby`, `partitionby`, or the window frame specifiers `rows` or `range`.

``` js
import { Query, row_number, avg } from "@uwdata/mosaic-sql";

// 7-day moving average (previous and next 3 days)
// and corresponding ordered row numbers
Query.select({
  avg: avg("foo").orderby("date").rows([3, 3]),
  num: row_number().orderby("date")
}).from("myTable");
```

[Window Functions API Reference](/api/sql/window-functions)

## Data Loading

Data loading helpers generate query strings for loading data from external CSV, JSON, or Parquet files: `loadCSV`, `loadJSON`, `loadParquet`.

``` js
import { loadCSV, loadParquet } from "@uwdata/mosaic-sql";

// Loads file.csv into the table "table1" with default options:
// CREATE TABLE IF NOT EXISTS table1 AS
//   SELECT *
//   FROM read_csv('file.csv', auto_detect=true, sample_size=-1)
const q1 = loadCSV("table1", "file.csv");

// Load named columns from a parquet file, filtered upon load:
// CREATE TABLE IF NOT EXISTS table2 AS
//   SELECT foo, bar, value
//   FROM read_parquet('file.parquet')
//   WHERE value > 1
const q2 = loadParquet("table2", "file.parquet", {
  select: [ "foo", "bar", "value" ],
  where: "value > 1"
});
```

Meanwhile, the `loadObjects` method takes an array of JavaScript objects and generates a query to insert those values into a database table.

``` js
import { loadObjects } from "@uwdata/mosaic-sql";

// CREATE TABLE IF NOT EXISTS table3 AS
//   (SELECT 1 AS "foo", 2 AS "bar") UNION ALL
//   (SELECT 3 AS "foo", 4 AS "bar") UNION ALL ...
const q = loadObjects("table3", [
  { foo: 1, bar: 2 },
  { foo: 3, bar: 4 },
  ...
]);
```

[Data Loading API Reference](/api/sql/data-loading)
