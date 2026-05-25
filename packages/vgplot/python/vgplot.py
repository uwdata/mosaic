# Shim to make `import vgplot` work in editable (local development) installs.
#
# uv editable installs add `packages/vgplot/python/` to sys.path via a .pth
# file, but the public API lives in the `api/` subdirectory. Without this file,
# `import vgplot` fails because there is no `vgplot` module or subdirectory on
# that path.
#
# The published wheel remaps `api/` → `vgplot/` via hatchling's `sources`
# config in pyproject.toml, so this shim is not needed there. It is only
# required locally until uv supports hatchling's virtual editable mode (which
# would apply source remapping at import time and make this file unnecessary).

from api import *  # noqa: F401, F403
from api import __all__
