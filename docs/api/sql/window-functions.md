# Window Functions

SQL window function expressions.

## WindowNode {#window-node}

The `WindowNode` class represents a window function.
It includes a non-null `window` property indicating a window expression.
Users should not need to instantiate `WindowNode` instances directly, but instead should use window function methods such as [`row_number()`](#row_number), [`lag()`](#lag), _etc_.

### over

`WindowNode.over(name)`

Provide the _name_ of a window definition for this function and returns a new WindowNode instance.
The window should be defined separately in an issued query, for example using the [Query.window](./queries#window) method.

### partitionby

`WindowNode.partitionby(...expressions)`

Provide one or more _expressions_ by which to partition this window function and returns a new WindowFunction instance.

### orderby

`WindowNode.orderby(...expressions)`

Provide one or more _expressions_ by which to sort this window function and returns a new WindowFunction instance.

### rows

`WindowNode.rows(expression)`

Provide a window "rows" frame specification as an array or array-valued _expression_ and returns a new WindowNode instance.
A "rows" window frame is insensitive to peer rows (those that are tied according to the [orderby](#orderby) criteria).
The frame expression should evaluate to a two-element array indicating the number of preceding or following rows.
A zero value (`0`) indicates the current row.
A non-finite value (including `null` and `undefined`) indicates either unbounded preceding row (for the first array entry) or unbounded following rows (for the second array entry).

### range

`WindowNode.range(expression)`

Provide a window "range" frame specification as an array or array-valued _expression_ and returns a new WindowNode instance.
A "range" window grows to include peer rows (those that are tied according to the [orderby](#orderby) criteria).
The frame expression should evaluate to a two-element array indicating the number of preceding or following rows.
A zero value (`0`) indicates the current row.
A non-finite value (including `null` and `undefined`) indicates either unbounded preceding row (for the first array entry) or unbounded following rows (for the second array entry).

## row_number {#row_number}

`row_number()`

Create a window function that returns the number of the current row
within the partition, counting from 1.

## rank

`rank()`

Create a window function that returns the rank of the current row with gaps.
This is the same as the row_number of its first peer.

## dense_rank {#dense_rank}

`dense_rank()`

Create a window function that returns the rank of the current row without gaps,
The function counts peer groups.

## percent_rank {#percent_rank}

`percent_rank()`

Create a window function that returns the relative rank of the current row.
Equal to (rank() - 1) / (total partition rows - 1).

## cume_dist {#cume_dist}

`cume_dist()`

Create a window function that returns the cumulative distribution.
(number of preceding or peer partition rows) / total partition rows.

## ntile

`ntile(num_buckets)`

Create a window function that r an integer ranging from 1 to _num\_buckets_,
dividing the partition as equally as possible.

## lag

`lag(expression, offset, default)`

Create a window function that returns the _expression_ evaluated at the row
that is _offset_ rows before the current row within the partition.
If there is no such row, instead return _default_ (which must be of the same
type as the expression). Both offset and default are evaluated with respect
to the current row. If omitted, offset defaults to 1 and default to null.

## lead

`lead(expression, offset, default)`

Create a window function that returns the _expression_ evaluated at the row
that is _offset_ rows after the current row within the partition.
If there is no such row, instead return _default_ (which must be of the same
type as the expression). Both offset and default are evaluated with respect
to the current row. If omitted, offset defaults to 1 and default to null.

## first_value {#first_value}

`first_value(expression)`

Create a window function that returns the _expression_ evaluated at the row
that is the first row of the window frame.

## last_value {#last_value}

`last_value(expression)`

Create a window function that returns the _expression_ evaluated at the row
that is the last row of the window frame.

## nth_value {#nth_value}

`nth_value(expression, nth)`

Create a window function that returns the _expression_ evaluated at the
_nth_ row of the window frame (counting from 1), or null if no such row.
