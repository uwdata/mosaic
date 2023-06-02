# Query

SQL query builders.
For example, a basic groupby aggregation query:

``` js
import { Query, count, gt, sum } from "@uwdata/mosaic-sql";

// SELECT "column", count() AS "count", sum("value") AS "value"
//   FROM "table" WHERE "value" > 0 GROUP BY "column"
Query
  .from("table")
  .select("column", { count: count(), sum: sum("value") })
  .groupby("column")
  .where(gt("value", 0))
```

Here is an overview of available methods:

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
  .offset(/* offet number of rows */)
```

## Query

The `Query` and related `SetOperation` classes provide structured representations of SQL queries.
Upon string coercion, these objects produce a complete SQL query string.

The following static methods create a new `Query` and invoke the corresponding method:

- `Query.select()`: See the [`select`](#select) method below.
- `Query.from()`: See the [`from`](#from) method below.
- `Query.with()`: See the [`with`](#with) method below.

In addition, the following static methods take multiple queries as input and return `SetOperation` instances:

- `Query.union(...queries)`: Union results with de-duplication of rows.
- `Query.unionAll(...queries)`: Union results with no de-duplication of rows.
- `Query.intersect(...queries)`: Query for distinct rows that are output by both the left and right input queries.
- `Query.except(...queries)`: Query for distinct rows from the left input query that aren't output by the right input query.

## select

`Query.select(...expressions)`

Select columns and return this query instance.
The _expressions_ argument may include column name strings, [`column` references](./expressions#column), and maps from column names to expressions (either as JavaScript `object` values or nested key-value arrays as produced by `Object.entries`).

## from

`Query.from(...tables)`

Indicate the tables to draw records from and return this query instance.
The _tables_ may be table name strings, queries or subquery expressions, and maps from table names to expressions (either as JavaScript `object` values or nested key-value arrays as produced by `Object.entries`).

## with

`Query.with(...expressions)`

Provide a set of named subqueries in the form of [common table expressions](https://duckdb.org/docs/sql/query_syntax/with.html) and return this query instance.
The input _expressions_ should consist of one or more maps (as JavaScript `object` values) from subquery names to query expressions.

## distinct

`Query.distinct()`

Update the query to require `DISTINCT` values only and return this query instance.

## sample

`Query.sample(value, method)`

Update the query to sample a subset of rows and return this query instance.

## where

`Query.where(...expressions)`

Update the query to additionally filter by the provided predicate _expressions_ and return this query instance.
This method is additive: any previously defined filter criteria will still remain.

## groupby

`Query.groupby(...expressions)`

Update the query to additionally group by the provided _expressions_ and return this query instance.
This method is additive: any previously defined group by criteria will still remain.

## having

`Query.having(...expressions)`

Update the query to additionally filter aggregate results by the provided predicate _expressions_ and return this query instance.
Unlike `where` criteria, which are applied before an aggregation, the `having` criteria are applied to aggregated results.
This method is additive: any previously defined filter criteria will still remain.

## window

`Query.window(...expressions)`

Update the query with named window frame definitions and return this query instance.
The _expressions_ arguments should be JavaScript `object` values that map from window names to window frame definitions.
This method is additive: any previously defined windows will still remain.

## qualify

`Query.qualify(...expressions)`

Update the query to additionally filter windowed results by the provided predicate _expressions_ and return this query instance.
Use this method instead of `where` to filter the results of window operations.
This method is additive: any previously defined filter criteria will still remain.

## orderby

`Query.orderby(...expressions)`

Update the query to additionally order results by the provided _expressions_ and return this query instance.
This method is additive: any previously defined sort criteria will still remain.

## limit

`Query.limit(rows)`

Update the query to limit results to the specified number of _rows_ and return this query instance.

## offset

`Query.offset(rows)`

Update the query to offset the results by the specified number of _rows_ and return this query instance.

## subqueries

`Query.subqueries`

The `subqueries` getter property returns an array of subquery instances, or an empty array if there are no subqueries.
