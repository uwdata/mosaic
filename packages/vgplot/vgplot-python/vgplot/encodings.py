from __future__ import annotations
from typing import Any


def sql(expr: str) -> dict[str, Any]:
    return {"sql": expr}


def count() -> dict[str, Any]:
    return {"count": ""}


def sum(col: str, **opts: Any) -> dict[str, Any]:
    return {"sum": col, **opts}


def avg(col: str, **opts: Any) -> dict[str, Any]:
    return {"avg": col, **opts}


def mean(col: str, **opts: Any) -> dict[str, Any]:
    return {"mean": col, **opts}


def min(col: str) -> dict[str, Any]:
    return {"min": col}


def max(col: str) -> dict[str, Any]:
    return {"max": col}


def median(col: str) -> dict[str, Any]:
    return {"median": col}


def argmax(col: str, by: str) -> dict[str, Any]:
    return {"argmax": [col, by]}


def argmin(col: str, by: str) -> dict[str, Any]:
    return {"argmin": [col, by]}


def bin(col: str, **opts: Any) -> dict[str, Any]:
    return {"bin": col, **opts}


def date_month(col: str) -> dict[str, Any]:
    return {"dateMonth": col}


def date_month_day(col: str) -> dict[str, Any]:
    return {"dateMonthDay": col}


def centroid_x(col: str) -> dict[str, Any]:
    return {"centroidX": col}


def centroid_y(col: str) -> dict[str, Any]:
    return {"centroidY": col}


def column(name: Any) -> dict[str, Any]:
    return {"column": name}


def geojson(col: str) -> dict[str, Any]:
    return {"geojson": col}


def channels(**kwargs: str) -> dict[str, str]:
    return dict(kwargs)
