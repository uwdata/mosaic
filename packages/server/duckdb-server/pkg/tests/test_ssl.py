from __future__ import annotations

import re
from dataclasses import dataclass
from typing import TYPE_CHECKING, Final, TypeAlias
from typing import Literal as L  # ruff: ignore[camelcase-imported-as-acronym]
from unittest.mock import patch

import pytest

from pkg.servers.common import Args, file_exists, user_config_path

if TYPE_CHECKING:
    from pathlib import Path

# TODO @dangotbanned: Switch this to a mark that's off by default
if not user_config_path().exists():
    pytest.skip("SSL cert/key tests depend on external state", allow_module_level=True)

Status: TypeAlias = L["exists", "non-existent"]
_STATUS: Final = "exists", "non-existent"


_STATIC_NAME_FILE_EXISTS: Final = f"{file_exists.__module__}.{file_exists.__name__}"
"""This function is mocked using this string.

By importing the function itself, the dependency will be visible to IDEs and be less likely
to break unintentionally.
"""


def re_compile(
    pattern: str, flags: re.RegexFlag = re.IGNORECASE | re.DOTALL
) -> re.Pattern[str]:
    """Compile a regular expression pattern, returning a Pattern object.

    Overrides stdlib `flags` default for more lenient error message matching.
    """
    return re.compile(pattern, flags)


@dataclass
class PEM:
    stores: L["cert", "key"]
    status: Status

    def path(self, parent: Path) -> Path:
        path = parent / f"{self.stores}-{self.status}.pem"
        if self.status == "exists":
            path.touch()
        return path


# TODO @dangotbanned: parametrize positive/negative cases
def test_default() -> None:
    parsed = Args.parse_args()
    resolved = parsed.resolve()
    assert resolved.ssl is not None
    cert, key = resolved.ssl.cert, resolved.ssl.key

    assert cert.exists()
    assert key.exists()


@pytest.mark.parametrize("key_status", _STATUS)
@pytest.mark.parametrize("cert_status", _STATUS)
def test_path_existence(
    cert_status: Status, key_status: Status, tmp_path: Path
) -> None:
    cert, key = PEM("cert", cert_status), PEM("key", key_status)
    cert_path, key_path = cert.path(tmp_path), key.path(tmp_path)
    parsed = Args.parse_args(
        "--cert", cert_path.as_posix(), "--key", key_path.as_posix()
    )
    match cert.status, key.status:
        case ("exists", "exists"):
            ssl = parsed.resolve().ssl
            assert ssl is not None
            assert ssl.cert == cert_path
            assert ssl.key == key_path
        case _:
            with pytest.raises(TypeError, match=re_compile(r"both.+must exist")):
                parsed.resolve()


@pytest.mark.parametrize(
    ("cert_provided", "key_provided"),
    [(False, True), (True, False)],
    ids=["key-only", "cert-only"],
)
def test_always_pair(cert_provided: bool, key_provided: bool, tmp_path: Path) -> None:
    allow = set()
    args = []
    for stores, provided in (("cert", cert_provided), ("key", key_provided)):
        if provided:
            p = PEM(stores, "exists")
            path = p.path(tmp_path)
            allow.add(path)
            args.extend((f"--{p.stores}", path.as_posix()))

    parsed = Args.parse_args(*args)

    def _reject_defaults(path: Path, /) -> bool:
        if path in allow:
            return path.is_file() and path.exists()
        return False

    with (
        patch(_STATIC_NAME_FILE_EXISTS, _reject_defaults),
        pytest.raises(TypeError, match=re_compile(r"both.+are required")),
    ):
        parsed.resolve()
