# Aggregate Functions

SQL aggregate function expressions.

## AggregateNode {#aggregate-node}

The `AggregateNode` class represents a SQL AST node for an aggregate function call.
Users should not need to instantiate `AggregateNode` instances directly, but instead should use aggregate function methods such as [`count()`](#count), [`sum()`](#sum), _etc_.

### distinct

`AggregateNode.distinct()`

Returns a new AggregateNode instance that applies the aggregation over distinct values only.

### where

`AggregateNode.where(filter)`

Returns a new AggregateNode instance filtered according to a Boolean-valied _filter_ expression.

### window

`AggregateNode.window()`

Returns a windowed version of this aggregate function as a new [WindowNode](./window-functions#window-node) instance.

### partitionby

`AggregateNode.partitionby(...expressions)`

Provide one or more _expressions_ by which to partition a windowed version of this aggregate function and returns a new [WindowNode](./window-functions#window-node) instance.

### orderby

`AggregateNode.orderby(...expressions)`

Provide one or more _expressions_ by which to sort a windowed version of this aggregate function and returns a new [WindowNodw](./window-functions#window-node) instance.

### rows

`AggregateNode.rows(expression)`

Provide a window "rows" frame specification as an array or array-valued _expression_ and returns a windowed version of this aggregate function as a new [WindowNode](./window-functions#window-node) instance.
A "rows" window frame is insensitive to peer rows (those that are tied according to the [orderby](#orderby) criteria).
The frame expression should evaluate to a two-element array indicating the number of preceding or following rows.
A zero value (`0`) indicates the current row.
A non-finite value (including `null` and `undefined`) indicates either unbounded preceding row (for the first array entry) or unbounded following rows (for the second array entry).

### range

`AggregateNode.range(expression)`

Provide a window "range" frame specification as an array or array-valued _expression_ and returns a windowed version of this aggregate function as a new [WindowNode](./window-functions#window-node) instance.
A "range" window grows to include peer rows (those that are tied according to the [orderby](#orderby) criteria).
The frame expression should evaluate to a two-element array indicating the number of preceding or following rows.
A zero value (`0`) indicates the current row.
A non-finite value (including `null` and `undefined`) indicates either unbounded preceding row (for the first array entry) or unbounded following rows (for the second array entry).

## count

`count()`

Create an aggregate function that counts the number of records.

## avg

`avg(expression)`

Create an aggregate function that calculates the average of the input _expression_.

## mad

`mad(expression)`

Create an aggregate function that calculates the median absolute deviation (MAD) of the input _expression_.

## max

`max(expression)`

Create an aggregate function that calculates the maximum of the input _expression_.

## min

`min(expression)`

Create an aggregate function that calculates the minimum of the input _expression_.

## sum

`sum(expression)`

Create an aggregate function that calculates the sum of the input _expression_.

## product

`product(expression)`

Create an aggregate function that calculates the product of the input _expression_.

## median

`median(expression)`

Create an aggregate function that calculates the average of the input _expression_.

## quantile

`quantile(expression, p)`

Create an aggregate function that calculates the _p_-th quantile of the input _expression_.
For example, _p_ = 0.5 computes the median, while 0.25 computes the lower inter-quartile range boundary.

## mode

`mode(expression)`

Create an aggregate function that calculates the mode of the input _expression_.

## variance

`variance(expression)`

Create an aggregate function that calculates the sample variance of the input _expression_.

## stddev

`stddev(expression)`

Create an aggregate function that calculates the sample standard deviation of the input _expression_.

## skewness

`skewness(expression)`

Create an aggregate function that calculates the skewness of the input _expression_.

## kurtosis

`kurtosis(expression)`

Create an aggregate function that calculates the kurtosis of the input _expression_.

## entropy

`entropy(expression)`

Create an aggregate function that calculates the entropy of the input _expression_.

## varPop

`varPop(expression)`

Create an aggregate function that calculates the population variance of the input _expression_.

## stddevPop

`stddevPop(expression)`

Create an aggregate function that calculates the population standard deviation of the input _expression_.

## corr

`corr(a, b)`

Create an aggregate function that calculates the correlation between the input expressions _a_ and _b_.

## covarPop

`covarPop(a, b)`

Create an aggregate function that calculates the population covariance between the input expressions _a_ and _b_.

## regrIntercept

`regrIntercept(y, x)`

Create an aggregate function that returns the intercept of the fitted linear regression model that predicts the target expression _y_ based on the predictor expression _x_.

## regrSlope

`regrSlope(y, x)`

Create an aggregate function that returns the slope of the fitted linear regression model that predicts the target expression _y_ based on the predictor expression _x_.

## regrCount

`regrCount(y, x)`

Create an aggregate function that returns the count of non-null values used to fit the linear regression model that predicts the target expression _y_ based on the predictor expression _x_.

## regrR2

`regrR2(y, x)`

Create an aggregate function that returns the R^2 value of the fitted linear regression model that predicts the target expression _y_ based on the predictor expression _x_.

## regrSXX

`regrSXX(y, x)`

Create an aggregate function that returns the SXX value (`regrCount(y, x) * varPop(x)`) of the fitted linear regression model that predicts the target expression _y_ based on the predictor expression _x_.

## regrSYY

`regrSYY(y, x)`

Create an aggregate function that returns the SYY value (`regrCount(y, x) * varPop(y)`) of the fitted linear regression model that predicts the target expression _y_ based on the predictor expression _x_.

## regrSXY

`regrSXY(y, x)`

Create an aggregate function that returns the SXY (`regrCount(y, x) * covarPop(y, x)`) value of the fitted linear regression model that predicts the target expression _y_ based on the predictor expression _x_.

## regrAvgX

`regrAvgX(y, x)`

Create an aggregate function that returns the average x value of the data used to fit the linear regression model that predicts the target expression _y_ based on the predictor expression _x_.

## regrAvgY

`regrAvgY(y, x)`

Create an aggregate function that returns the average x value of the data used to fit the linear regression model that predicts the target expression _y_ based on the predictor expression _x_.

## first

`first(expression)`

Create an aggregate function that calculates the first observed value of the input _expression_.

## last

`last(expression)`

Create an aggregate function that calculates the last observed value of the input _expression_.

## argmax

`argmax(arg, value)`

Create an aggregate function that returns the expression _arg_ corresponding to the maximum value of the expression _value_.

## argmin

`argmin(arg, value)`

Create an aggregate function that returns the expression _arg_ corresponding to the minimum value of the expression _value_.

## stringAgg

`stringAgg(expression)`

Create an aggregate function that returns the string concatenation of the input _expression_ values.

## arrayAgg

`arrayAgg(expression)`

Create an aggregate function that returns a list of the input _expression_ values.
