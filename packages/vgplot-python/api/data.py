from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class DataDef:
    payload: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return self.payload


def parquet(file: str) -> DataDef:
    return DataDef({"type": "parquet", "file": file})


def table(query: str) -> DataDef:
    return DataDef({"type": "table", "query": query})


def data(**named_defs: DataDef) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in named_defs.items():
        out[k] = v.to_dict() if hasattr(v, "to_dict") else v
    return out
