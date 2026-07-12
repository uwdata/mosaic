from __future__ import annotations

import copy
from typing import TYPE_CHECKING, Any, Union, get_type_hints

if TYPE_CHECKING:
    # NOTE: Don't move this into a runtime import (yet)
    from vgplot._types import UNSET


def _import_unset() -> UNSET:
    # NOTE: A regular import would add:
    # - `vgplot._types` to `sys.modules`
    # - `UNSET` to `globals`
    # And we can't use `importlib.reload`, since that would create a new object
    from vgplot._types import UNSET

    return UNSET


def test_unset_identity() -> None:
    unset_1 = _import_unset()
    unset_2 = _import_unset()
    assert unset_1 is unset_2


def test_unset_repr() -> None:
    assert repr(_import_unset()) == "UNSET"


def test_unset_pickle() -> None:
    import pickle

    unset = _import_unset()
    assert pickle.loads(pickle.dumps(unset)) is unset  # noqa: S301


def test_unset_type_expression_union() -> None:
    # Adapted from https://github.com/python/typing_extensions/blob/83400e979b8e3b0b647f9a6a57f0275230e5f19f/src/test_typing_extensions.py#L9694-L9701
    from vgplot._types import UNSET

    def func1(a: int | UNSET = UNSET) -> None: ...
    def func2(a: UNSET | int = UNSET) -> None: ...

    assert get_type_hints(func1, localns=locals())["a"] is Union[int, UNSET]  # noqa: UP007
    assert get_type_hints(func2, localns=locals())["a"] is Union[UNSET, int]  # noqa: UP007


def test_unset_copy_identity() -> None:
    # Adapted from https://github.com/python/typing_extensions/blob/83400e979b8e3b0b647f9a6a57f0275230e5f19f/src/test_typing_extensions.py#L9711-L9713
    unset = _import_unset()
    assert unset is copy.copy(unset)
    assert unset is copy.deepcopy(unset)


def test_unset_union_identity() -> None:
    unset = _import_unset()
    assert (unset | unset) is unset


if TYPE_CHECKING:
    from typing_extensions import assert_type

    def typing_unset(
        a: UNSET, b: str | UNSET, c: Any | UNSET, d: int | None | UNSET = UNSET
    ) -> None:
        assert_type(a, UNSET)
        assert_type(b, str | UNSET)
        assert_type(c, Any | UNSET)
        assert_type(d, int | None | UNSET)
