import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

# This test lives in: .../packages/vgplot-python/test/test_full_round_trip.py

ROOT = Path(__file__).resolve().parents[3]
SPEC_DIR = ROOT / "specs"
JSON_DIR = SPEC_DIR / "json"
ESM_DIR = SPEC_DIR / "esm"
PYTHON_DIR = SPEC_DIR / "python"
RUNNER = ROOT / "tests" / "tools" / "run_spec_file.py"


def load_json_fixture(name: str) -> dict:
    return json.loads((JSON_DIR / f"{name}.json").read_text(encoding="utf-8"))


def run_subprocess(command: list[str], **kwargs) -> str:
    completed = subprocess.run(
        command,
        check=True,
        capture_output=True,
        text=True,
        **kwargs,
    )
    return completed.stdout


def run_python_spec(spec_path: Path) -> dict:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(ROOT) + os.pathsep + env.get("PYTHONPATH", "")

    stdout = run_subprocess(
        [sys.executable, str(RUNNER), str(spec_path)],
        cwd=ROOT,
        env=env,
    )
    return json.loads(stdout)


JSON_EXAMPLES = sorted(path.stem for path in JSON_DIR.glob("*.json"))
ESM_EXAMPLES = sorted(path.stem for path in ESM_DIR.glob("*.js"))
PYTHON_EXAMPLES = sorted(path.stem for path in PYTHON_DIR.glob("*.py"))


def test_generated_examples_stay_in_sync():
    assert PYTHON_EXAMPLES == JSON_EXAMPLES
    assert ESM_EXAMPLES == JSON_EXAMPLES


@pytest.mark.parametrize("example_name", PYTHON_EXAMPLES)
def test_python_round_trip(example_name: str):
    generated = run_python_spec(PYTHON_DIR / f"{example_name}.py")
    original = load_json_fixture(example_name)

    assert generated == original, (
        f"Round-trip Python mismatch for '{example_name}'.\n"
        f"> original:  {original}\n"
        f"> generated: {generated}"
    )
