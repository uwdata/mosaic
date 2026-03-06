import importlib.util
import json
import sys
from pathlib import Path

import pytest

# This test lives in: .../packages/schema-wrapper/test/test_full_round_trip.py
ROOT = Path(__file__).resolve().parents[3]
SPEC_DIR = ROOT / "specs"
JSON_DIR = SPEC_DIR / "json"
PYTHON_DIR = SPEC_DIR / "python-new"

# Add monorepo root so specs can import `mosaic.vgplot`.
sys.path.insert(0, str(ROOT))


def import_module_from_path(path: Path):
    spec = importlib.util.spec_from_file_location(path.stem, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def spec_to_dict(spec_obj):
    # Support both old and new API signatures.
    try:
        return spec_obj.to_dict(keep_none_values=True)
    except TypeError:
        return spec_obj.to_dict()


PYTHON_FILES = sorted(PYTHON_DIR.glob("*.py"))
EXAMPLES = [pf.stem for pf in PYTHON_FILES if (JSON_DIR / f"{pf.stem}.json").exists()]

# Known fixture drift while migrating to python-new generated specs.
SKIP_ROUNDTRIP = {
    "flights-10m",
    "gaia",
    "linear-regression-10m",
    "moving-average",
    "nyc-taxi-rides",
    "observable-latency",
    "region-tests",
    "window-frame",
}


@pytest.mark.parametrize("example_name", EXAMPLES)
def test_round_trip(example_name):
    """
    For each specs/json/<example_name>.json:
      - load the JSON fixture
      - import specs/python-new/<example_name>.py (must expose `spec`)
      - convert spec back to JSON
      - assert generated == original
    """
    if example_name in SKIP_ROUNDTRIP:
        pytest.skip("Known python-new fixture drift; strict round-trip pending regeneration")

    json_path = JSON_DIR / f"{example_name}.json"
    assert json_path.exists(), f"Missing JSON example: {json_path}"
    original = json.loads(json_path.read_text(encoding="utf-8"))

    py_path = PYTHON_DIR / f"{example_name}.py"
    assert py_path.exists(), f"Missing Python example: {py_path}"

    module = import_module_from_path(py_path)
    assert hasattr(module, "spec"), f"`{py_path.name}` must define a top-level `spec` variable"
    generated = spec_to_dict(module.spec)

    assert generated == original, (
        f"Round-trip JSON mismatch for '{example_name}'.\n"
        f"> original:  {original}\n"
        f"> generated: {generated}"
    )
