from collections.abc import Sequence
from datetime import date
from typing import Any

from .data import DataDef
from .params import _ParamBase
from .plot import FromRef

# Value unions: wide enough for column names, constants, param references,
# dates, and transform dicts; narrow enough that passing a Mark or View
# where a value belongs is a type error.
ChannelValue = (
    str | float | bool | date | dict[str, Any] | Sequence[Any] | _ParamBase | None
)
AttrValue = (
    str | float | bool | date | dict[str, Any] | Sequence[Any] | _ParamBase | None
)
MarkData = str | FromRef | DataDef | dict[str, Any] | Sequence[Any] | _ParamBase | None
TransformArg = str | float | bool | _ParamBase


class _Unset:
    """Sentinel for mark channels that were not passed (distinct from None)."""

    def __repr__(self) -> str:
        return "UNSET"


UNSET: Any = _Unset()
