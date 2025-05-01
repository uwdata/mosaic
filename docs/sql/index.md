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

## Operators

The Mosaic SQL package includes operators for manipulating and comparing values:

- Logical operators: `and`, `or`, `not`
- Comparison operators: `eq`, `neq`, `lt`, `gt`, `lte`, `gte`
- Range operators: `isBetween`, `isNotBetween`
- Set operators: `isIn`
- Null checks: `isNull`, `isNotNull`
- Null-sensitive comparison: `isDistinct`, `isNotDistinct`
- Arithmetic operators: `add`, `sub`, `mul`, `div`, `idiv`, `mod`, `pow`
- Bitwise operators: `bitNot`, `bitAnd`, `bitOr`, `bitLeft`, `bitRight`
- Conditionals: `cond`

When given a string input, an operator function interprets it as a column name.

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

DuckDB-supported [aggregate functions](https://duckdb.org/docs/sql/aggregates.html), including `min`, `max`, `count`, `sum`, `avg`, `stddev`, `median`, `quantile`, `argmax`, `argmin`, `corr`, and others.

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

## SQL Expressions

When deeper analysis is not needed, the `sql` template literal can be used to build individual SQL expressions using custom text.

``` js
import { Query, sql } from "@uwdata/mosaic-sql";
Query
  .select({ logFoo: sql`log(foo + 1)` })
  .from("myTable");
```

Interpolated values may include column references, nested expressions, or params.
Referenced columns or params can later be extracted using SQL expression visitors.

``` js
import { Param } from "@uwdata/core";
import { collectColumns, collectParams, column, sql } from "@uwdata/mosaic-sql";

const col = column("foo");
const param = Param.value(Math.PI);
const expr = sql`${col} * ${param}`;

const cols = collectColumns(expr); // -> [ col ]
const params = collectParams(expr): // -> [ param ]
```

[Expression API Reference](/api/sql/expressions)

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
