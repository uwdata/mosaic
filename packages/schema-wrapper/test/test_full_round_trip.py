import sys, types
from pathlib import Path
import importlib.util

# ─── Bootstrap the `mosaic` package so examples can `import mosaic…` ───────
# 1) Stub out empty `mosaic` and `mosaic.spec` modules
sys.modules["mosaic"]      = types.ModuleType("mosaic")
sys.modules["mosaic.spec"] = types.ModuleType("mosaic.spec")

# 2) Load your real generated_classes.py as `mosaic.generated_classes`
ROOT    = Path(__file__).resolve().parents[3]
gc_path = ROOT / "packages" / "schema-wrapper" / "schema_wrapper" / "generated_classes.py"
loader  = importlib.util.spec_from_file_location("mosaic.generated_classes", str(gc_path))
mod     = importlib.util.module_from_spec(loader)
loader.loader.exec_module(mod)
sys.modules["mosaic.generated_classes"] = mod

import pytest
import json
import sys
import importlib.util
from pathlib import Path

# ─── 1) Locate your monorepo root and specs folders ─────────────────────────
# This test lives in: .../packages/schema-wrapper/test/test_full_round_trip.py
ROOT = Path(__file__).resolve().parents[3]
SPEC_DIR   = ROOT / "specs"
JSON_DIR   = SPEC_DIR / "json"
PYTHON_DIR = SPEC_DIR / "python"

# Add your library to sys.path so examples can import mosaic, generated_classes, etc.
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "packages" / "schema-wrapper" / "schema_wrapper"))

def import_module_from_path(path: Path):
    spec = importlib.util.spec_from_file_location(path.stem, str(path))
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

# ─── 2) Build the list of test cases from the JSON files ────────────────────
# JSON files are named with hyphens, e.g. "aeromagnetic-survey.json"
JSON_FILES = sorted(JSON_DIR.glob("*.json"))
EXAMPLES = [jf.stem for jf in JSON_FILES]  # e.g. ["aeromagnetic-survey", "foo-bar", ...]

@pytest.mark.parametrize("example_name", EXAMPLES)
def test_round_trip(example_name):
    """
    For each specs/json/<example_name>.json:
      - load the JSON
      - import specs/python/<example_name.replace('-', '_')>.py (must expose `spec`)
      - spec.to_dict(keep_none_values=True)
      - assert that generated == original
    """
    # 1) Locate JSON
    json_path = JSON_DIR / f"{example_name}.json"
    assert json_path.exists(), f"Missing JSON example: {json_path}"
    original = json.loads(json_path.read_text(encoding="utf-8"))

    # 2) Locate Python example
    py_filename = example_name.replace("-", "-") + ".py"
    py_path = PYTHON_DIR / py_filename
    assert py_path.exists(), f"Missing Python example: {py_path}"

    # 3) Import and grab `spec`
    mod = import_module_from_path(py_path)
    assert hasattr(mod, "spec"), f"`{py_filename}` must define a top–level `spec` variable"
    spec_obj = mod.spec

    # 4) Round‑trip back to JSON
    generated = spec_obj.to_dict(keep_none_values=True)

    # 5) Compare
    assert generated == original, (
        f"Round‑trip JSON mismatch for “{example_name}”.\n"
        f"> original:  {original}\n"
        f"> generated: {generated}"
    )
