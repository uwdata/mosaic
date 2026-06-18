# Tests that every generated Python spec (specs/python/*.py) round-trips
# correctly: running the file produces JSON identical to the reference fixture
# in specs/json/. Also checks that Python, JSON, and ESM example sets stay
# in sync (same filenames).
#
# Run: pytest packages/vgplot/vgplot-python/test/test_full_round_trip.py
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[4]  # mosaic project root
SPEC_DIR = ROOT / "specs"
JSON_DIR = SPEC_DIR / "json"
ESM_DIR = SPEC_DIR / "esm"
PYTHON_DIR = SPEC_DIR / "python"

VGPLOT_SRC = ROOT / "packages" / "vgplot" / "vgplot-python" / "src"

for p in (VGPLOT_SRC, ROOT):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))


def load_json_fixture(name: str) -> dict:
    return json.loads((JSON_DIR / f"{name}.json").read_text(encoding="utf-8"))


def run_spec_file_with_exec(path: Path) -> dict:
    namespace: dict[str, object] = {
        "__name__": "__spec_exec__",
        "__file__": str(path),
        "__builtins__": __builtins__,
    }
    code = compile(path.read_text(encoding="utf-8"), str(path), "exec")
    exec(code, namespace)

    spec = namespace.get("spec")
    if spec is None:
        raise AssertionError(f"`{path.name}` must define a top-level `spec` variable")
    if not hasattr(spec, "to_dict"):
        raise AssertionError(
            f"`spec` in `{path.name}` does not expose to_dict()"
        )
    return spec.to_dict()


JSON_EXAMPLES = sorted(path.stem for path in JSON_DIR.glob("*.json"))
ESM_EXAMPLES = sorted(path.stem for path in ESM_DIR.glob("*.js"))
PYTHON_EXAMPLES = sorted(path.stem for path in PYTHON_DIR.glob("*.py"))


def test_generated_examples_stay_in_sync():
    assert PYTHON_EXAMPLES == JSON_EXAMPLES
    assert ESM_EXAMPLES == JSON_EXAMPLES


@pytest.mark.parametrize("example_name", PYTHON_EXAMPLES)
def test_python_round_trip(example_name: str):
    generated = run_spec_file_with_exec(PYTHON_DIR / f"{example_name}.py")
    original = load_json_fixture(example_name)

    assert generated == original, (
        f"Round-trip Python mismatch for '{example_name}'.\n"
        f"> original:  {original}\n"
        f"> generated: {generated}"
    )
