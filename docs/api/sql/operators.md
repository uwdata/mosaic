# Operators

SQL comparison operator expressions.

## and

`and(...clauses)`

Returns an expression for the logical `AND` of the provided _clauses_.
The _clauses_ array will be flattened and any `null` entries will be ignored.

## or

`or(...clauses)`

Returns an expression for the logical `OR` of the provided _clauses_.
The _clauses_ array will be flattened and any `null` entries will be ignored.

## not

`not(expression)`

Returns an expression for the logical `NOT` of the provided _expression_.

## eq

`eq(a, b)`

Returns an expression testing if expression _a_ is equal to expression _b_.
In SQL semantics, two `NULL` values are not considered equal.
Use `isNotDistinct` to compare values with `NULL` equality.

## neq

`neq(a, b)`

Returns an expression testing if expression _a_ is not equal to expression _b_.
In SQL semantics, two `NULL` values are not considered equal.
Use `isDistinct` to compare values with `NULL` equality.

## lt

`lt(a, b)`

Returns an expression testing if expression _a_ is less than expression _b_.

## gt

`gt(a, b)`

Returns an expression testing if expression _a_ is greater than expression _b_.

## lte

`lte(a, b)`

Returns an expression testing if expression _a_ is less than or equal to expression _b_.

## gte

`gte(a, b)`

Returns an expression testing if expression _a_ is greater than or equal to expression _b_.

## isNull

`isNull(expression)`

Returns an expression testing if the input _expression_ is a `NULL` value.

## isNotNull

`isNotNull(expression)`

Returns an expression testing if the input _expression_ is not a `NULL` value.

## isDistinct

`isDistinct(a, b)`

Returns an expression testing if expression _a_ is distinct from expression _b_.
Unlike normal SQL equality checks, here `NULL` values are not considered distinct.

## isNotDistinct

Returns an expression testing if expression _a_ is not distinct from expression _b_.
Unlike normal SQL equality checks, here `NULL` values are not considered distinct.

## isBetween

`isBetween(expression, [lo, hi])`

Returns an expression testing if the input _expression_ lies between the values _lo_ and _hi_, provided as a two-element array.
Equivalent to `lo <= expression AND expression <= hi`.

## isNotBetween

`isNotBetween(expression, [lo, hi])`

Returns an expression testing if the input _expression_ does not lie between the values _lo_ and _hi_, provided as a two-element array.
Equivalent to `NOT(lo <= expression AND expression <= hi)`.

## isIn

`isIn(expression, values)`

Returns an expression testing if the input _expression_ matches any of the entries in the _values_ array. Maps to `expression IN (...values)`.
