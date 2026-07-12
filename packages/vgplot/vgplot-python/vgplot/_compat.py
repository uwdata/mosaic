from __future__ import annotations

# ruff: noqa: A002
import sys
import typing
from importlib.util import find_spec
from typing import TYPE_CHECKING, Any, ClassVar


def _sentinel_backport_pre_typing_extensions_4_16() -> Any:  # noqa: C901
    # TODO @dangotbanned: Try inlining `_caller` and always using `1`?
    def _caller(depth: int = 1, default: str = "__main__") -> str | None:
        try:
            return sys._getframemodulename(depth + 1) or default  # ty: ignore[unresolved-attribute]
        except AttributeError:  # For platforms without _getframemodulename()
            pass
        try:
            return sys._getframe(depth + 1).f_globals.get("__name__", default)
        except (AttributeError, ValueError):  # For platforms without _getframe()
            pass
        return None

    class _sentinel_backport:
        """Create a unique sentinel object.

        *name* should be the name of the variable to which the return value shall be assigned.
        """

        def __init__(self, name: str, /, *, repr: str | None = None) -> None:
            self.__name__: str = name
            self._repr: str = repr if repr is not None else name
            # For pickling as a singleton (blocks using `__slots__`)

            # TODO @dangotbanned: Figure out why they didn;t use the `"__main__"` default here?
            self.__module__ = _caller()  # pyright: ignore[reportAttributeAccessIssue] # ty: ignore[invalid-assignment]

        __init_subclass__: ClassVar[None] = None

        def __repr__(self) -> str:
            return self._repr

        if sys.version_info < (3, 11):
            # The presence of this method convinces typing._type_check that Sentinels are types.
            def __call__(self, *args: Any, **kwargs: Any) -> Any:
                msg = f"{type(self).__name__!r} object is not callable"
                raise TypeError(msg)

        def __or__(self, other: Any) -> Any:
            return typing.Union[self, other]  # noqa: UP007

        def __ror__(self, other: Any) -> Any:
            return typing.Union[other, self]  # noqa: UP007

        def __reduce__(self) -> str:
            return self.__name__

    return _sentinel_backport


def _sentinel_backport_pre_py_3_15() -> Any:
    """Return a [PEP 661](https://peps.python.org/pep-0661/)-compatible [`sentinel`](https://docs.python.org/3.15/library/functions.html#sentinel) factory.

    ## Notes
    - Does not depend on `typing_extensions`, but will use it if a suitable version is available
    - Fallback is adapted from [`typing_extensions==4.16.0`](https://github.com/python/typing_extensions/blob/f29cd28d8ed7642cafb1d18daf5aa41be6a5c0aa/src/typing_extensions.py#L176-L271)
    """
    if find_spec("typing_extensions"):
        import typing_extensions

        # NOTE: In the same release the name changed, this guy landed https://github.com/python/typing_extensions/pull/617
        # `4.14-4.15` is fine for typing, but the runtime changes are too big to rely on
        if hasattr(typing_extensions, "sentinel"):
            return getattr(typing_extensions, "sentinel", typing_extensions.Sentinel)

    return _sentinel_backport_pre_typing_extensions_4_16()


if TYPE_CHECKING:
    # Was renamed in https://github.com/python/typing_extensions/releases/tag/4.16.0
    from typing_extensions import Sentinel as sentinel  # noqa: N813
else:  # noqa: PLR5501
    if sys.version_info >= (3, 15):
        from builtins import sentinel
    else:
        sentinel = _sentinel_backport_pre_py_3_15()


__all__ = ("sentinel",)
