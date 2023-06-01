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

The `Query` class supports a rich set of SQL features, including subqueries (pass other queries as `from()` arguments) and [common table expressions](https://duckdb.org/docs/sql/query_syntax/with.html) (via the `with()` method). Here is a run down of the provided methods:

``` js
Query
  .with(/* a map of named common table expression queries */)
  .select(/* column names or name -> expression maps */)
  .distinct(/* distinct values only */)
  .from(/* source tables or subqueries */)
  .sample(/* number of rows or % */)
  .where(/* filter criteria */)
  .groupby(/* columns or expressions to group by */)
  .having(/* post-aggregation filter criteria */)
  .window(/* window definitions */)
  .qualify(/* post-window filter criteria */)
  .orderby(/* columns or expressions to sort by */)
  .limit(/* max number of rows */)
  .offset(/* offet number of rows */)
```

## SQL Expressions

The `sql` template literal builds individual SQL expressions.

``` js
import { Query, sql } from "@uwdata/mosaic-sql";
Query.select({ logFoo: sql`log(foo + 1)` }).from('myTable');
```

Interpolated values may include column references, nested expressions, or Params.
The resulting expression will keep track of referenced columns.
Expressions that contain a [Param](/core/#params) will listen for updates and act like Params of their own, including support for `value` event listeners.

``` js
import { Param } from "@uwdata/core";
import { column, sql } from "@uwdata/mosaic-sql";

const col = column('foo');
const param = Param.value(Math.PI);
const expr = sql`${col} * ${param}`;

expr.addEventListener('value', v => console.log('Update!', v));
param.update(Math.E); // --> expr will invoke value listeners
```

The `agg` template literal is similar to `sql`, but additionally flags the result as an aggregate expression.
This annotation can guide query construction and analysis.

``` js
import { Query, agg, column } from "@uwdata/mosaic-sql";
const foo = column('foo');
const bar = column('bar');
Query
  .from("myTable")
  .select({ hi: agg`GREATEST(MAX(${foo}), MAX(${bar}))` });
```

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

## Aggregate Functions

Functions for [DuckDB-supported aggregates](https://duckdb.org/docs/sql/aggregates.html). Examples include `min`, `max`, `count`, `sum`, `avg`, `stddev`, `median`, `quantile`, `argmax`, and `argmin`.

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

## Window Functions

General purpose [window functions](https://duckdb.org/docs/sql/window_functions):
`row_number`, `rank`, `cume_dist`, `lag`, `lead`, _etc_.
Aggregate functions become window operations (moving averages, etc.) if you specify the parameters `orderby`, `partitionby`, or the window frame `rows` or `range`.

``` js
import { Query, row_number, avg } from "@uwdata/mosaic-sql";

// 7-day moving average (previous and next 3 days),
// and corresponding ordered row numbers
Query.select({
  avg: avg("foo").orderby("date").rows([3, 3]),
  num: row_number().orderby("date")
}).from("myTable");
```

## Data Loading

Data loading helpers generate query strings for loading data from external CSV, JSON, or Parquet files: `loadCSV`, `loadJSON`, `loadParquet`.

``` js
import { loadCSV, loadParquet } from "@uwdata/mosaic-sql";

// loads file.csv into the table "table1" with default options
const q1 = loadCSV("table1", "file.csv");

// load named columns from a parquet file, filtered upon load
const q2 = loadParquet("table2", "file.parquet", {
  select: [ "foo", "bar", "value" ],
  where: "value > 1"
});
```

Meanwhile, the `loadObjects` method takes an array of JavaScript objects and generates a query to insert those values into a database table.

``` js
import { loadObjects } from "@uwdata/mosaic-sql";
const q = loadObjects("table3", [
 { foo: 1, bar: 2 },
 { foo: 3, bar: 4 },
 ...
]);
```
