from __future__ import annotations
from typing import Any, Dict


def sql(expr: str) -> Dict[str, Any]:
    return {"sql": expr}


def count() -> Dict[str, Any]:
    return {"count": ""}


def sum(col: str, **opts: Any) -> Dict[str, Any]:
    return {"sum": col, **opts}


def avg(col: str, **opts: Any) -> Dict[str, Any]:
    return {"avg": col, **opts}


def mean(col: str, **opts: Any) -> Dict[str, Any]:
    return {"mean": col, **opts}


def min(col: str) -> Dict[str, Any]:
    return {"min": col}


def max(col: str) -> Dict[str, Any]:
    return {"max": col}


def median(col: str) -> Dict[str, Any]:
    return {"median": col}


def argmax(col: str, by: str) -> Dict[str, Any]:
    return {"argmax": [col, by]}


def argmin(col: str, by: str) -> Dict[str, Any]:
    return {"argmin": [col, by]}


def bin(col: str, **opts: Any) -> Dict[str, Any]:
    return {"bin": col, **opts}


def date_month(col: str) -> Dict[str, Any]:
    return {"dateMonth": col}


def date_month_day(col: str) -> Dict[str, Any]:
    return {"dateMonthDay": col}


def centroid_x(col: str) -> Dict[str, Any]:
    return {"centroidX": col}


def centroid_y(col: str) -> Dict[str, Any]:
    return {"centroidY": col}


def column(name: Any) -> Dict[str, Any]:
    return {"column": name}


def geojson(col: str) -> Dict[str, Any]:
    return {"geojson": col}


def channels(**kwargs: str) -> Dict[str, str]:
    return dict(kwargs)
