"""Mosaic-specific typing."""

from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeAlias, TypedDict
from typing import Literal as L  # ruff: ignore[camelcase-imported-as-acronym]

if TYPE_CHECKING:
    from typing_extensions import NotRequired


# TODO @dangotbanned: Split into `{Arrow,Exec}(Comm|Request|Command)`
class QueryParams(TypedDict):
    type: L["arrow", "exec"]
    sql: str
    uuid: str


class QueryError(TypedDict):
    error: str
    uuid: str


class QueryResult(TypedDict):
    type: L["arrow", "exec"]
    uuid: str


class Param(TypedDict):
    value: object
    predicate: NotRequired[str]


Spec: TypeAlias = Mapping[str, Mapping[str, Any]]
