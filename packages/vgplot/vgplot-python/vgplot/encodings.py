from __future__ import annotations

from typing import Any


def sql(expr: str) -> dict[str, Any]:
    return {"sql": expr}


def mean(col: str, **opts: Any) -> dict[str, Any]:
    return {"mean": col, **opts}


def channels(**kwargs: str) -> dict[str, str]:
    return dict(kwargs)
