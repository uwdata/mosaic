"""Helpers for extracting table/selection relationships from a Mosaic spec.

These helpers power ``MosaicWidget.sql`` and ``MosaicWidget.data()`` by
discovering which selections are used as ``filterBy`` on which source tables
and by combining the live ``predicate`` strings on the ``params`` traitlet
into a SQL ``WHERE`` clause.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any


def _param_name(value: Any) -> str | None:
    """Return the param name for a ``$name`` reference, else None."""
    if isinstance(value, str) and value.startswith("$") and len(value) > 1:
        return value[1:]
    return None


def _is_literal_table(value: Any) -> bool:
    return isinstance(value, str) and not value.startswith("$")


def collect_table_filters(spec: Mapping[str, Any]) -> dict[str, list[str]]:
    """Walk a Mosaic spec and map each source table to its ``filterBy`` selections.

    Mark ``data`` blocks of the form ``{"from": "<table>", "filterBy": "$sel"}``
    contribute a ``table -> [selection]`` entry. Tables referenced without a
    ``filterBy`` still appear in the result with an empty list. Dynamic ``from``
    values that are param references (``"$tableParam"``) are skipped.

    Selection names appear in document order and are de-duplicated.
    """
    result: dict[str, list[str]] = {}

    def add_filter(table: str, filter_by: Any) -> None:
        names = result.setdefault(table, [])
        candidates = filter_by if isinstance(filter_by, list) else [filter_by]
        for entry in candidates:
            name = _param_name(entry)
            if name is not None and name not in names:
                names.append(name)

    def visit(node: Any) -> None:
        if isinstance(node, Mapping):
            data = node.get("data")
            if isinstance(data, Mapping) and _is_literal_table(data.get("from")):
                table = data["from"]
                result.setdefault(table, [])
                if "filterBy" in data:
                    add_filter(table, data["filterBy"])
            for value in node.values():
                visit(value)
        elif isinstance(node, list):
            for item in node:
                visit(item)

    visit(spec)
    return result


def resolve_predicates(
    params: Mapping[str, Any], selection_names: Iterable[str]
) -> list[str]:
    """Collect non-empty ``predicate`` strings for the given selection names.

    Names without a corresponding entry in ``params``, or whose entry lacks a
    predicate (e.g. a plain Param rather than a Selection), are silently
    skipped. The order of the returned list matches the order of
    ``selection_names``.
    """
    predicates: list[str] = []
    for name in selection_names:
        entry = params.get(name)
        if not isinstance(entry, Mapping):
            continue
        predicate = entry.get("predicate")
        if isinstance(predicate, str) and predicate.strip():
            predicates.append(predicate)
    return predicates
