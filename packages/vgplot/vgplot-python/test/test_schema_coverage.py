# Ensures the exported vgplot API covers every mark, attribute, interactor, and
# input in the Mosaic JSON schema (the source of truth). Marks and attributes
# are generated; interactors and inputs are hand-written. This guards against a
# schema addition that was never generated or hand-added.
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
for p in (ROOT / "packages" / "vgplot" / "vgplot-python", ROOT):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

import vgplot as vg  # noqa: E402

SCHEMA = ROOT / "docs" / "public" / "schema" / "latest.json"

# Schema names whose Python export is renamed or intentionally absent.
RENAME = {"table": "table_input"}  # `table` input -> vg.table_input (vg.table is data)
IGNORE = {"value"}  # internal selection const, not a user-facing interactor


def _snake(name: str) -> str:
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name).lower()


def _consts(defs: dict, key: str) -> set[str]:
    out = set()
    for d in defs.values():
        prop = d.get("properties", {}).get(key)
        if isinstance(prop, dict) and "const" in prop:
            out.add(prop["const"])
    return out


def test_schema_surface_is_exported():
    defs = json.loads(SCHEMA.read_text())["definitions"]
    names = (
        _consts(defs, "mark")
        | _consts(defs, "select")
        | _consts(defs, "input")
        | set(defs["PlotAttributes"]["properties"])
    ) - IGNORE

    exported = set(vg.__all__)
    missing = sorted(n for n in names if RENAME.get(n, _snake(n)) not in exported)
    assert not missing, f"schema names with no exported vgplot function: {missing}"
