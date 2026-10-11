from __future__ import annotations

import pytest

from pkg.servers.common import user_config_path

if not user_config_path().exists():
    pytest.skip("SSL cert/key tests depend on external state", allow_module_level=True)
