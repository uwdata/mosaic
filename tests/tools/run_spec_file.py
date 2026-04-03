"""Execute a generated spec file and print `spec.to_dict()` as JSON."""

from __future__ import annotations

import json
import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def main() -> int:
    if len(sys.argv) != 2:
        print(
            "Usage: python tests/tools/run_spec_file.py <spec_file.py>",
            file=sys.stderr,
        )
        return 2

    spec_path = Path(sys.argv[1]).resolve()
    if not spec_path.is_file():
        print(
            f"Spec file not found: {spec_path}",
            file=sys.stderr,
        )
        return 2

    namespace = runpy.run_path(str(spec_path))
    spec = namespace.get("spec")
    if spec is None:
        print(
            f"Expected global `spec` in: {spec_path}",
            file=sys.stderr,
        )
        return 1
    if not hasattr(spec, "to_dict"):
        print(
            f"`spec` does not expose to_dict() in: {spec_path}",
            file=sys.stderr,
        )
        return 1

    print(json.dumps(spec.to_dict(), sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
