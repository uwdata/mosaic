from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import narwhals as nw


@dataclass
class DataDef:
    payload: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return self.payload


def is_frame(obj: Any) -> bool:
    """True if `obj` is a dataframe-like object (pandas/polars/Arrow/...)."""
    if obj is None or isinstance(
        obj, (str, bytes, int, float, bool, dict, list, tuple)
    ):
        return False
    try:
        nw.from_native(obj)
    except TypeError:
        return False
    return True


def parquet(file: str, select: Any = None, where: Any = None, **kwargs: Any) -> DataDef:
    payload: dict[str, Any] = {"type": "parquet", "file": file}
    if select is not None:
        payload["select"] = select
    if where is not None:
        payload["where"] = where
    payload.update(kwargs)
    return DataDef(payload)


def csv(file: str, **kwargs: Any) -> DataDef:
    return DataDef({"type": "csv", "file": file, **kwargs})


def spatial(file: str, layer: str | None = None, **kwargs: Any) -> DataDef:
    payload: dict[str, Any] = {"type": "spatial", "file": file}
    if layer is not None:
        payload["layer"] = layer
    payload.update(kwargs)
    return DataDef(payload)


def table(query: str) -> DataDef:
    return DataDef({"type": "table", "query": query})


def json(data: Any = None, file: str | None = None, **kwargs: Any) -> DataDef:
    payload: dict[str, Any] = {"type": "json"}
    if file is not None:
        payload["file"] = file
    if data is not None:
        payload["data"] = data
    payload.update(kwargs)
    return DataDef(payload)


def data(**named_defs: DataDef) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for k, v in named_defs.items():
        out[k] = v.to_dict() if hasattr(v, "to_dict") else v
    return out
