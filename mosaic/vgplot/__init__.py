"""Expose the Python vgplot API from the source tree."""
# ruff: noqa: E402,F401,F403

from __future__ import annotations

import sys
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parents[2] / "packages" / "vgplot-python"

if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))

from api import *
from api import __all__, __getattr__
