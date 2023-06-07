# SQL Expressions

SQL expression builders.

## column

`column(name)`

Create an expression that references a column by _name_.
Upon string coercion, the column name will be properly quoted.

## literal

`literal(value)`

Create an expression that references a literal _value_.
Upon string coercion, an appropriate SQL value will be produced.
For example, string literals will be properly quoted and JavaScript `Date` objects that match an extact UTC date will be converted to the SQL statement `MAKE_DATE(year, month, day)`.

## sql

``sql`...` ``

A template tag for arbitrary SQL expressions.
Interpolated values may be strings, other SQL expressions (such as [`column` references](#column) or [operators](./operators)), or [`Param`](../core/param) values.


The snippet below creates a dynamic expression that adds a Param value to a column. The resulting expression will track the column dependency and expose an [`addEventListener`](#addeventlistener) method for tracking param changes.

``` js
const param = Param.value(5);
sql`${column("foo")} + ${param}`
```

SQL expressions may be nested, in which case all nested column dependencies and parameter updates will propagate to the top-level expression.

## agg

``agg`...` ``

A template tag for aggregate SQL expressions.
This method is similar to [`sql`](#sql), but additionally annotates the resulting expression with an `aggregate` property to indicate that it is an aggregate expression.
This is valuable for helping downstream tools provide a cursory query analysis.

## SQLExpression

`new SQLExpression(spans, column, props)`

The `SQLExpression` class provides a structured object format for SQL expressions.
Typically you will not want to create an expression using the class constructor, but instead use more convenient, high-level methods such as those above.

The constructor takes three arguments:

- _parts_: an ordered array of expression components, which may include strings, sub-expressions, or Param values. When "concatenated" together, these parts should form the full expression.
- _columns_: an array column name strings, indicating columns the expression depends on. Note that if a column is provided only via raw strings, that dependency will not be tracked.
- _props_: an optional object of key-value pairs with which to annotate the resulting expression object. For example, a non-null `aggregate` property will indicate an aggregate expression. Different expression generators may include different annotations to track state and simplify downstream analysis.

### columns

`SQLExpression.columns`

The `columns` property returns an array of tracked column dependencies.
The column list is de-duplicated, and includes dynamic dependencies that may be due to Param-valued expression components.

### column

`SQLExpression.column`

A convenience property for accessing the first column in the [`columns`](#columns) array, or undefined if there is no such column.

### annotate

`SQLExpression.annotate(props)`

Annotate this expression instance with additional properties and return this expression instance.

### toString

`SQLExpression.toString()`

Returns a SQL expression string based on the current state of this expression instance.

### addEventListener

`SQLExpression.addEventListener(type, callback)`

If an expression includes any Param values, it will expose this method.
Expression updates are broadcast using the `"value"` event type.
