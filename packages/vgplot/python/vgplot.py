# editable installs (uv sync) add packages/vgplot/python/ to sys.path, but the
# API lives in api/. The pyproject.toml sources mapping renames api/ → vgplot/
# in wheel builds, but hatchling raises ValueError for that rename in editable
# mode (https://github.com/pfmoore/editables/issues/20). This shim bridges the
# gap for local development only and the published wheel doesn't use it.

from api import *  # noqa: F401, F403
