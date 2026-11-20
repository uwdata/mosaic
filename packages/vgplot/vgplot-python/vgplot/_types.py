from __future__ import annotations

from collections.abc import Sequence
from datetime import date
from typing import Any, TypeAlias

from narwhals.typing import IntoFrame

from vgplot._compat import sentinel

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
MarkData: TypeAlias = (
    str
    | FromRef
    | DataDef
    | IntoFrame
    | dict[str, Any]
    | Sequence[Any]
    | _ParamBase
    | None
)
TransformArg = str | float | bool | dict[str, Any] | _ParamBase

TableName = str | Sequence[str]
"""A database table name. A single string is one identifier; a sequence of
identifiers denotes a schema-qualified table, as in ``["schema", "table"]``,
and is serialized as a JSON array. Wrap it in ``vg.source(...)`` to use it as
mark data: a bare list passed directly as mark data is inline data."""

UNSET = sentinel("UNSET")
"""Sentinel for mark channels that were not passed (distinct from None)."""

MimeBundle: TypeAlias = dict[str, str] | tuple[dict[str, Any], dict[str, Any]] | None
