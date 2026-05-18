from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class DataDef:
    payload: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return self.payload


def parquet(file: str, select: Any = None, where: Any = None, **kwargs: Any) -> DataDef:
    payload: Dict[str, Any] = {"type": "parquet", "file": file}
    if select is not None:
        payload["select"] = select
    if where is not None:
        payload["where"] = where
    payload.update(kwargs)
    return DataDef(payload)


def csv(file: str, **kwargs: Any) -> DataDef:
    return DataDef({"type": "csv", "file": file, **kwargs})


def spatial(file: str, layer: str | None = None, **kwargs: Any) -> DataDef:
    payload: Dict[str, Any] = {"type": "spatial", "file": file}
    if layer is not None:
        payload["layer"] = layer
    payload.update(kwargs)
    return DataDef(payload)


def table(query: str) -> DataDef:
    return DataDef({"type": "table", "query": query})


def data(**named_defs: DataDef) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in named_defs.items():
        out[k] = v.to_dict() if hasattr(v, "to_dict") else v
    return out
