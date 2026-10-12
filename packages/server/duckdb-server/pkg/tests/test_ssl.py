from __future__ import annotations

import pytest

from pkg.servers.common import Args, user_config_path

# TODO @dangotbanned: Switch this to an mark that's off by default
if not user_config_path().exists():
    pytest.skip("SSL cert/key tests depend on external state", allow_module_level=True)


# TODO @dangotbanned: parametrize positive/negative cases
def test_ssl_args() -> None:
    parsed = Args.parse_args()
    resolved = parsed.resolve()
    assert resolved.ssl is not None
    cert, key = resolved.ssl.cert, resolved.ssl.key

    assert cert.exists()
    assert key.exists()
