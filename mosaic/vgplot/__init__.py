"""Expose the Python vgplot API from the source tree."""

from __future__ import annotations

import sys
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parents[2] / "packages" / "python-api"

if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))

from vgplot import *  # noqa: F401,F403
from vgplot import __all__, __getattr__
