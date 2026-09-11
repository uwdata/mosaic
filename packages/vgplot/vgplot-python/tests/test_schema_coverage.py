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

    class Schema(TypedDict, closed=True, total=False):
        properties: dict[str, dict[str, Any]]
        anyOf: Sequence[Schema]

    class Definitions(TypedDict, extra_items=Schema):
        PlotAttributes: Schema


ROOT = Path(__file__).resolve().parents[4]
SCHEMA = ROOT / "docs" / "public" / "schema" / "latest.json"

# Schema names whose Python export is renamed or intentionally absent.
RENAME = {"table": "table_input"}  # `table` input -> vg.table_input (vg.table is data)
IGNORE = {"value"}  # internal selection const, not a user-facing interactor


def _snake(name: str) -> str:
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name).lower()


def get_discriminator_values(defs: Definitions, key: str) -> set[str]:
    out: set[str] = set()
    for d in defs.values():
        if (p := d.get("properties")) and (c := p.get(key, {}).get("const")):
            out.add(c)
        elif u := d.get("anyOf"):
            out.update(
                c
                for member in u
                if (p := member.get("properties"))
                and (c := p.get(key, {}).get("const"))
            )
    return out


def test_schema_surface_is_exported() -> None:
    defs: Definitions = json.loads(SCHEMA.read_text("utf-8"))["definitions"]
    names = (
        get_discriminator_values(defs, "mark")
        | get_discriminator_values(defs, "select")
        | get_discriminator_values(defs, "input")
        | set(defs["PlotAttributes"].get("properties", ()))
    ) - IGNORE

    exported = set(vg.__all__)
    missing = sorted(n for n in names if RENAME.get(n, _snake(n)) not in exported)
    assert not missing, f"schema names with no exported vgplot function: {missing}"
