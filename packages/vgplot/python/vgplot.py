# Shim to make `import vgplot` work in editable (local development) installs.
#
# uv editable installs add `packages/vgplot/python/` to sys.path via a .pth
# file, but the public API lives in the `api/` subdirectory. Without this file,
# `import vgplot` fails because there is no `vgplot` module or subdirectory on
# that path.
#
# Ideally, hatchling's `sources` option would remap `api/` → `vgplot/` in both
# the wheel and the editable install. However, editable installs do not support
# prefix renaming (https://github.com/pfmoore/editables/issues/20), so this
# shim is the current workaround for local development.

from api import *  # noqa: F401, F403
from api import __all__
