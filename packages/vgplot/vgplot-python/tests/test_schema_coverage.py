# Ensures the exported vgplot API covers every mark, attribute, interactor, and
# input in the Mosaic JSON schema (the source of truth). Marks and attributes
# are generated; interactors and inputs are hand-written. This guards against a
# schema addition that was never generated or hand-added.
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import TYPE_CHECKING, Any

import vgplot as vg

if TYPE_CHECKING:
    from collections.abc import Sequence

    from typing_extensions import TypedDict

    class SchemaObject(TypedDict, closed=True):
        properties: dict[str, dict[str, Any]]

    class SchemaUnion(TypedDict, closed=True):
        anyOf: Sequence[SchemaObject]

    class Definitions(TypedDict, extra_items=SchemaObject | SchemaUnion):
        PlotAttributes: SchemaObject


ROOT = Path(__file__).resolve().parents[4]
SCHEMA = ROOT / "docs" / "public" / "schema" / "latest.json"

# Schema names whose Python export is renamed or intentionally absent.
RENAME = {"table": "table_input"}  # `table` input -> vg.table_input (vg.table is data)
IGNORE = {"value"}  # internal selection const, not a user-facing interactor


def _snake(name: str) -> str:
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name).lower()


def _const(node: SchemaObject, key: str) -> str | None:
    return node.get("properties", {}).get(key, {}).get("const")


def _consts(defs: Definitions, key: str) -> set[str]:
    """Const values for `key`, including intersection defs (anyOf/allOf) whose
    branches all agree on a single const (e.g. the densityX mark)."""
    out: set[str] = set()
    for d in defs.values():
        if "properties" in d:
            c = _const(d, key)  # pyright: ignore[reportArgumentType]
            if c is not None:
                out.add(c)
                continue

        if "anyOf" in d:
            for b in d["anyOf"]:  # pyright: ignore[reportGeneralTypeIssues]
                if const := _const(b, key):
                    out.add(const)
    return out


def test_schema_surface_is_exported() -> None:
    defs: Definitions = json.loads(SCHEMA.read_text("utf-8"))["definitions"]
    names = (
        _consts(defs, "mark")
        | _consts(defs, "select")
        | _consts(defs, "input")
        | set(defs["PlotAttributes"]["properties"])
    ) - IGNORE

    exported = set(vg.__all__)
    missing = sorted(n for n in names if RENAME.get(n, _snake(n)) not in exported)
    assert not missing, f"schema names with no exported vgplot function: {missing}"
