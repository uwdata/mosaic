from __future__ import annotations

from typing import Any


def _resolve(v: Any, param_names: "dict[int, str] | None") -> Any:
    """Recursively resolve _ParamBase objects to "$name" ref strings."""
    if param_names is None:
        return v
    if isinstance(v, _ParamBase):
        name = param_names.get(id(v))
        return f"${name}" if name is not None else v
    if isinstance(v, list):
        return [_resolve(x, param_names) for x in v]
    if isinstance(v, dict):
        return {k: _resolve(val, param_names) for k, val in v.items()}
    return v


class _ParamBase:
    """Base for Param and Selection instances used as param ref tokens."""


class ParamValue(_ParamBase):
    def __init__(self, value: Any = None) -> None:
        self._value = value

    def param_def(self, **_: Any) -> Any:
        return self._value

    def __repr__(self) -> str:
        return f"param.value({self._value!r})"


class ParamArray(_ParamBase):
    def __init__(self, values: list) -> None:
        self._values = list(values)

    def param_def(self, param_names: "dict[int, str] | None" = None) -> Any:
        return [_resolve(v, param_names) for v in self._values]

    def __repr__(self) -> str:
        return f"param.array({self._values!r})"


class SelectionDef(_ParamBase):
    def __init__(self, select: str, **opts: Any) -> None:
        self._select = select
        self._opts = {k: v for k, v in opts.items() if v is not None}

    def param_def(self, param_names: "dict[int, str] | None" = None) -> Any:
        d: dict = {"select": self._select}
        d.update(_resolve(self._opts, param_names))
        return d

    def __repr__(self) -> str:
        opts = ", ".join(f"{k}={v!r}" for k, v in self._opts.items())
        return f"selection.{self._select}({opts})"


def param(value: Any = None) -> "_ParamBase":
    if isinstance(value, list):
        return ParamArray(value)
    return ParamValue(value)


class selection:
    """Namespace for creating selection params."""

    @staticmethod
    def intersect(**opts: Any) -> SelectionDef:
        return SelectionDef("intersect", **opts)

    @staticmethod
    def crossfilter(**opts: Any) -> SelectionDef:
        return SelectionDef("crossfilter", **opts)

    @staticmethod
    def union(**opts: Any) -> SelectionDef:
        return SelectionDef("union", **opts)

    @staticmethod
    def single(**opts: Any) -> SelectionDef:
        return SelectionDef("single", **opts)
