# DO NOT EDIT. Generated from the Mosaic JSON schema by bin/generate-python-api.js.
# Regenerate with: pnpm run generate:python-api

from typing import Any

from .._types import UNSET, TransformArg


def _transform(
    name: str, args: tuple[Any, ...], options: dict[str, Any]
) -> dict[str, Any]:
    vals = [a for a in args if a is not UNSET]
    value: Any = vals[0] if len(vals) == 1 else vals or ""
    return {name: value, **options}


def argmax(col: TransformArg, by: TransformArg, **options: Any) -> dict[str, Any]:
    """Find a value of the first column that maximizes the second column."""
    return _transform("argmax", (col, by), options)


def argmin(col: TransformArg, by: TransformArg, **options: Any) -> dict[str, Any]:
    """Find a value of the first column that minimizes the second column."""
    return _transform("argmin", (col, by), options)


def avg(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the average (mean) value of the given column."""
    return _transform("avg", (col,), options)


def bin(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Bin a continuous variable into discrete intervals."""
    return _transform("bin", (col,), options)


def centroid(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the 2D centroid of geometry-typed data."""
    return _transform("centroid", (col,), options)


def centroid_x(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the centroid x-coordinate of geometry-typed data."""
    return _transform("centroidX", (col,), options)


def centroid_y(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the centroid y-coordinate of geometry-typed data."""
    return _transform("centroidY", (col,), options)


def column(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Interpret a string or param-value as a column reference."""
    return _transform("column", (col,), options)


def count(col: TransformArg | UNSET = UNSET, **options: Any) -> dict[str, Any]:
    """Compute the count of records in an aggregation group."""
    return _transform("count", (col,), options)


def cume_dist(**options: Any) -> dict[str, Any]:
    """Compute the cumulative distribution value over an ordered window partition."""
    return {"cume_dist": None, **options}


def date_day(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Transform a Date value to a day of the month for cyclic comparison."""
    return _transform("dateDay", (col,), options)


def date_month(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Transform a Date value to a month boundary for cyclic comparison."""
    return _transform("dateMonth", (col,), options)


def date_month_day(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Transform a Date value to a month and day boundary for cyclic comparison."""
    return _transform("dateMonthDay", (col,), options)


def dense_rank(**options: Any) -> dict[str, Any]:
    """Compute the dense row rank (no gaps) over an ordered window partition."""
    return {"dense_rank": None, **options}


def first(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Return the first column value found in an aggregation group."""
    return _transform("first", (col,), options)


def first_value(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Get the first value of the given column in the current window frame."""
    return _transform("first_value", (col,), options)


def geojson(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute a GeoJSON-formatted string from geometry-typed data."""
    return _transform("geojson", (col,), options)


def lag(
    col: TransformArg,
    offset: TransformArg | UNSET = UNSET,
    default: TransformArg | UNSET = UNSET,
    **options: Any,
) -> dict[str, Any]:
    """Compute lagging values in a column."""
    return _transform("lag", (col, offset, default), options)


def last(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Return the last column value found in an aggregation group."""
    return _transform("last", (col,), options)


def last_value(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Get the last value of the given column in the current window frame."""
    return _transform("last_value", (col,), options)


def lead(
    col: TransformArg,
    offset: TransformArg | UNSET = UNSET,
    default: TransformArg | UNSET = UNSET,
    **options: Any,
) -> dict[str, Any]:
    """Compute leading values in a column."""
    return _transform("lead", (col, offset, default), options)


def max(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the maximum value of the given column."""
    return _transform("max", (col,), options)


def median(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the median value of the given column."""
    return _transform("median", (col,), options)


def min(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the minimum value of the given column."""
    return _transform("min", (col,), options)


def mode(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the mode value of the given column."""
    return _transform("mode", (col,), options)


def nth_value(
    col: TransformArg, offset: TransformArg | UNSET = UNSET, **options: Any
) -> dict[str, Any]:
    """Get the nth value of the given column in the current window frame, counting from one."""
    return _transform("nth_value", (col, offset), options)


def ntile(buckets: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute an n-tile integer ranging from 1 to the provided argument (num_buckets), dividing the partition as equally as possible."""
    return _transform("ntile", (buckets,), options)


def percent_rank(**options: Any) -> dict[str, Any]:
    """Compute the percentage rank over an ordered window partition."""
    return {"percent_rank": None, **options}


def product(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the product of the given column."""
    return _transform("product", (col,), options)


def quantile(col: TransformArg, p: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the quantile value of the given column at the provided probability threshold."""
    return _transform("quantile", (col, p), options)


def rank(**options: Any) -> dict[str, Any]:
    """Compute the row rank over an ordered window partition."""
    return {"rank": None, **options}


def row_number(**options: Any) -> dict[str, Any]:
    """Compute the 1-based row number over an ordered window partition."""
    return {"row_number": None, **options}


def stddev(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the sum of the given column."""
    return _transform("stddev", (col,), options)


def stddev_pop(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the sum of the given column."""
    return _transform("stddevPop", (col,), options)


def sum(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the sum of the given column."""
    return _transform("sum", (col,), options)


def variance(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the sample variance of the given column."""
    return _transform("variance", (col,), options)


def var_pop(col: TransformArg, **options: Any) -> dict[str, Any]:
    """Compute the population variance of the given column."""
    return _transform("varPop", (col,), options)


__all__ = [
    "argmax",
    "argmin",
    "avg",
    "bin",
    "centroid",
    "centroid_x",
    "centroid_y",
    "column",
    "count",
    "cume_dist",
    "date_day",
    "date_month",
    "date_month_day",
    "dense_rank",
    "first",
    "first_value",
    "geojson",
    "lag",
    "last",
    "last_value",
    "lead",
    "max",
    "median",
    "min",
    "mode",
    "nth_value",
    "ntile",
    "percent_rank",
    "product",
    "quantile",
    "rank",
    "row_number",
    "stddev",
    "stddev_pop",
    "sum",
    "variance",
    "var_pop",
]
