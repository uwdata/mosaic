# Queries

SQL query builders.
These utilities build structured representations of queries that are easier to create, manipulate, and analyze.

For example, here is a basic group-by aggregation query that counts the number of records and adds up values by category:

``` js
import { Query, count, gt, sum } from "@uwdata/mosaic-sql";

// SELECT "column", count() AS "count", sum("value") AS "value"
//   FROM "table" WHERE "value" > 0 GROUP BY "column"
Query
  .from("table")
  .select("category", { count: count(), sum: sum("value") })
  .groupby("category")
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

To learn more about the anatomy of a query, take a look at the [DuckDB Select statement documentation](https://duckdb.org/docs/sql/statements/select).

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

## clone

`query.clone()`

Return a new query that is a shallow copy of the current instance.

## select

`query.select(...expressions)`

Select columns and return this query instance.
The _expressions_ argument may include column name strings, [`column` references](./expressions#column), and maps from column names to expressions (either as JavaScript `object` values or nested key-value arrays as produced by `Object.entries`).

## from

`query.from(...tables)`

Indicate the tables to draw records from and return this query instance.
The _tables_ may be table name strings, queries or subquery expressions, and maps from table names to expressions (either as JavaScript `object` values or nested key-value arrays as produced by `Object.entries`).

## with

`query.with(...expressions)`

Provide a set of named subqueries in the form of [common table expressions](https://duckdb.org/docs/sql/query_syntax/with.html) and return this query instance.
The input _expressions_ should consist of one or more maps (as JavaScript `object` values) from subquery names to query expressions.

## distinct

`query.distinct()`

Update the query to require `DISTINCT` values only and return this query instance.

## sample

`query.sample(size, method)`

Update the query to sample a subset of _rows_ and return this query instance.
If _size_ is a number between 0 and 1, it is interpreted as a percentage of the full dataset to sample.
Otherwise, it is interpreted as the number of rows to sample.
The _method_ argument is a string indicating the sample method, such as `"reservoir"`, `"bernoulli"` and `"system"`.
See the [DuckDB Sample documentation](https://duckdb.org/docs/sql/samples) for more.

## where

`query.where(...expressions)`

Update the query to additionally filter by the provided predicate _expressions_ and return this query instance.
This method is additive: any previously defined filter criteria will still remain.

## groupby

`query.groupby(...expressions)`

Update the query to additionally group by the provided _expressions_ and return this query instance.
This method is additive: any previously defined group by criteria will still remain.

## having

`query.having(...expressions)`

Update the query to additionally filter aggregate results by the provided predicate _expressions_ and return this query instance.
Unlike `where` criteria, which are applied before an aggregation, the `having` criteria are applied to aggregated results.
This method is additive: any previously defined filter criteria will still remain.

## window

`query.window(...expressions)`

Update the query with named window frame definitions and return this query instance.
The _expressions_ arguments should be JavaScript `object` values that map from window names to window frame definitions.
This method is additive: any previously defined windows will still remain.

## qualify

`query.qualify(...expressions)`

Update the query to additionally filter windowed results by the provided predicate _expressions_ and return this query instance.
Use this method instead of `where` to filter the results of window operations.
This method is additive: any previously defined filter criteria will still remain.

## orderby

`query.orderby(...expressions)`

Update the query to additionally order results by the provided _expressions_ and return this query instance.
This method is additive: any previously defined sort criteria will still remain.

## limit

`query.limit(rows)`

Update the query to limit results to the specified number of _rows_ and return this query instance.

## offset

`query.offset(rows)`

Update the query to offset the results by the specified number of _rows_ and return this query instance.

## subqueries

`query.subqueries`

The `subqueries` getter property returns an array of subquery instances, or an empty array if there are no subqueries.

## toString

`query.toString()`

Coerce this query object to a SQL query string.
