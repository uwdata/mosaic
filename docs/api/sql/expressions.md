# SQL Expressions

SQL expression builders. All SQL expressions are represented in the form of an abstract syntax tree (AST). Helper methods and functions build out this tree.

## all

`all()`

Create an AST node for the SQL `ALL` keyword, for use in `GROUP BY ALL` and `ORDER BY ALL` clauses.
Grouping by `ALL` groups by all non-aggregate columns in the `SELECT` clause; ordering by `ALL` sorts by all columns from left to right.
The node can be passed to `asc` or `desc` to set the sort direction.

``` js
Query.from("t").select("a", "b", { n: count() }).groupby(all()).orderby(all())
```

## cast

`cast(expression, type)`

Create an AST node that casts the input _expression_ to the given _type_ string, such as `"INTEGER"` or `"VARCHAR"`.
String-valued _expression_ arguments are interpreted as column references.
Maps to `(expression)::type`. If the cast fails, the query raises an error; use [`tryCast`](#trycast) to return `NULL` instead.

The `int32(expression)`, `float32(expression)`, and `float64(expression)` functions are shorthands for casts to `INTEGER`, `FLOAT`, and `DOUBLE`, respectively.

## column

`column(name)`

Create an expression AST node that references a column by _name_.
Upon string coercion, the column name will be properly quoted.

## columns

`columns(selector, unpack = false)`

Create an AST node for a DuckDB `COLUMNS` expression, which expands to multiple columns.
The _selector_ may be a regular expression string matched against column names, an array of column names, a [`lambda`](#lambda) over column names, or a [`star`](#star) expression.
If _unpack_ is true, creates an unpacked `*COLUMNS` expression that expands to multiple function arguments.

``` js
Query.from("t").select(columns("^price_"))                  // COLUMNS('^price_')
Query.from("t").select({ m: max(columns(["a", "b"])) })     // max(COLUMNS(['a', 'b'])) AS "m"
greatest(columns(lambda("c", c => prefix(c, "x")), true))  // greatest(*COLUMNS(lambda "c": starts_with("c", 'x')))
```

When collecting columns with `collectColumns`, an array selector contributes the listed columns, while regular expression and lambda selectors contribute a `*` column reference.

## cte

`cte(name, query, materialized)`

Create an AST node for a Common Table Expression (CTE) to be used within a SQL `WITH` clause.
The resulting node can be passed as an argument to the `Query.with()` method.
The string-valued _name_ and Query-valued _query_ arguments are required.
The optional boolean-valued _materialized_ argument indicates if the CTE should be materialized during query execution; if unspecified, it is left to the backing database to decide.

## lambda

`lambda(params, body)`

Create an AST node for a lambda function, rendered as `lambda x, y: body` (requires DuckDB 1.3 or later).
The _params_ argument is a parameter name string or an array of names.
The _body_ argument is a callback that receives a parameter reference for each name and returns the body expression.
Parameter references are distinct from column references: `collectColumns` and other column analyses ignore them, while column references in the body are still collected.
Lambdas can be included among the arguments of a `FunctionNode`:

``` js
// list_transform("names", lambda "x": upper("x"))
new FunctionNode("list_transform", [column("names"), lambda("x", x => upper(x))])
```

The _body_ may instead be an expression that references parameters using `LambdaVarNode` instances, which is useful when translating from another AST.

## literal

`literal(value)`

Create an expression AST node that references a literal _value_.
Upon string coercion, an appropriate SQL value will be produced.
For example, string literals will be properly quoted and JavaScript `Date` objects that match an exact UTC date will be converted to the SQL Date definitions.
The supported primitive types are: boolean, null, number, string, regexp, and Date (maps to SQL Date or Timestamp depending on the value).

## namedArg

`namedArg(name, expression)`

Create an AST node for a named function argument, rendered as `name := expression`.
String-valued _expression_ arguments are interpreted as column references; use [`literal`](#literal) for string values.
Named arguments can be included among the arguments of a `FunctionNode`, for example to create struct values:

``` js
new FunctionNode("struct_pack", [namedArg("x", 1), namedArg("y", column("foo"))])
```

## positionalRef

`positionalRef(index)`

Create an AST node for a positional column reference by 1-based _index_, rendered as `#index`.
Within an `ORDER BY` clause, a positional reference refers to a column of the `SELECT` clause; elsewhere it refers to a column of the `FROM` clause relation.

``` js
// SELECT #2 AS "x" FROM "t" ORDER BY #1
Query.from("t").select({ x: positionalRef(2) }).orderby(positionalRef(1))
```

As the referenced column is not named, `collectColumns` reports a positional reference as referencing all columns (`*`).

## sql

``sql`...` ``

A template tag for arbitrary SQL expressions that do not require deep analysis.
Creates an expression AST node with only a partially structured form consisting of unstructured text and interpolated values.
Interpolated values may be strings, other SQL expressions (such as [`column` references](#column) or [operators](./operators)), or [`Param`](../core/param) values.

The snippet below creates a dynamic expression that adds a Param value to a column.
Contained column references can be extracted using the `collectColumns` method.
Contained Param values can be extracted using the `collectParams` method.

``` js
const param = Param.value(5);
sql`${column("foo")} + ${param}`
```

SQL expressions may be nested, in which case all nested column dependencies and parameter updates are still extractable via the collection visitors.

## star

`star(table, options)`

Create an AST node for a star (`*`) expression that selects all columns, with optional `EXCLUDE`, `REPLACE`, and `RENAME` modifiers.
If a _table_ is provided, the star is qualified, as in `table.*`.
The _options_ object supports the following properties:

- _exclude_: An array of columns to exclude, as column name strings or [`column`](#column) references.
- _replace_: An object mapping column names to replacement expressions.
- _rename_: An object mapping current column names to new names, or an array of `[column, name]` pairs, where _column_ is a column name string or [`column`](#column) reference.

Use `column` references with a _table_ argument to exclude or rename table-qualified columns, for example to disambiguate columns that share a name across joined tables:

``` js
// SELECT * EXCLUDE ("b"."id") RENAME ("b"."value" AS "value_b") FROM ...
star(null, {
  exclude: [column("id", "b")],
  rename: [[column("value", "b"), "value_b"]]
})
```

``` js
// SELECT * EXCLUDE ("id") REPLACE (("price" * 2) AS "price") RENAME ("qty" AS "quantity") FROM "t"
Query.from("t").select(star(null, {
  exclude: ["id"],
  replace: { price: mul("price", 2) },
  rename: { qty: "quantity" }
}))
```

A star is a column reference with the column name `*`, so `collectColumns` reports it as referencing all columns, along with any columns referenced by replacement expressions.

## tryCast

`tryCast(expression, type)`

Like [`cast`](#cast), but returns `NULL` if the cast fails rather than raising an error.
Maps to `TRY_CAST(expression AS type)`.
