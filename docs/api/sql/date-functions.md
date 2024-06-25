# Date Functions

SQL date function expressions.

## epoch_ms

`epoch_ms(expression)`

Returns a function expression that maps the input date or datetime _expression_ to the number of milliseconds since the UNIX epoch (Jan 1, 1970 UTC).

## dateBin

`dateBin(expression, interval, steps = 1)`

Returns a function expression that bins the input date or datetime _expression_ to the given [date/time _interval_](https://duckdb.org/docs/sql/functions/datepart.html) such as `hour`, `day`, or `month`. The optional _steps_ argument indicates an integer bin step size in terms of intervals, such as every 1 day or every 2 days.

## dateMonth

`dateMonth(expression)`

Returns a function expression that maps the input date or datetime _expression_ to the first day of the corresponding month in the year 2012.
This function is useful to map dates across varied years to a shared frame for cyclic comparison while maintaining a temporal data type.
The year 2012 is a convenient target as it is a leap year that starts on a Sunday.

## dateMonthDay

`dateMonthDay(expression)`

Returns a function expression that maps the input date or datetime _expression_ to the corresponding month and day in the year 2012.
This function is useful to map dates across varied years to a shared frame for cyclic comparison while maintaining a temporal data type.
The year 2012 is a convenient target as it is a leap year that starts on a Sunday.

## dateDay

`dateDay(expression)`

Returns a function expression that maps the input date or datetime _expression_ to the corresponding day of the month in January 2012.
This function is useful to map dates across varied years to a shared frame for cyclic comparison while maintaining a temporal data type.
The year 2012 is a convenient target as it is a leap year that starts on a Sunday.
