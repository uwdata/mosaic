from __future__ import annotations

import enum
from collections.abc import Callable, Mapping, Sequence
from functools import partial
from importlib.util import find_spec
from typing import TYPE_CHECKING, Any, Final, Generic, TypeAlias, TypeVar

import narwhals as nw
import pytest
from narwhals import Implementation as Impl
from narwhals.typing import EagerAllowed, LazyAllowed
from pytest import FixtureRequest as Request

if TYPE_CHECKING:
    import dask.dataframe as dd
    import duckdb
    import ibis
    import modin.pandas as mpd
    import pandas as pd
    import polars as pl
    import pyarrow as pa

    NativeDataFrame: TypeAlias = pa.Table | pd.DataFrame | pl.DataFrame | mpd.DataFrame
    NativeLazyFrame: TypeAlias = (
        dd.DataFrame | duckdb.DuckDBPyRelation | ibis.Table | pl.LazyFrame
    )


Data: TypeAlias = Mapping[str, Sequence[Any]]
"""Columnar data for a dataframe backend."""

NwDataFrame: TypeAlias = nw.DataFrame["NativeDataFrame"]
"""A constructed [`narwhals.DataFrame`][], with a known backend."""

DataFrameConstructor: TypeAlias = Callable[[Data], NwDataFrame]
"""A constructor for a [`narwhals.DataFrame`][]."""


class Warn(enum.Flag):
    COPY = enum.auto()
    MATERIALIZE = enum.auto()
    ALL = COPY | MATERIALIZE


_LAZY: Final = frozenset[LazyAllowed]().union(
    *((i, i.value) for i in (Impl.POLARS, Impl.IBIS, Impl.DUCKDB, Impl.DASK))
)

_BackendT = TypeVar("_BackendT", bound=EagerAllowed | LazyAllowed, covariant=True)


class Backend(Generic[_BackendT]):
    """Wrapper around a Narwhals [`backend`][narwhals.typing.IntoBackend]."""

    __slots__ = ("requires", "value", "warn")

    def __init__(
        self, value: _BackendT, requires: str = "", warn: Warn = Warn(0)
    ) -> None:
        self.value: _BackendT = value
        """Argument for `backend` in Narwhals constructors."""
        self.requires: str = requires or str(value)
        """Package that must be available for this backend."""
        self.warn: Warn = warn
        """Warnings expected on registration."""

    def __repr__(self) -> str:
        return str(self.value)

    def is_available(self) -> bool:
        return bool(find_spec(self.requires))

    def is_lazy_allowed(self) -> bool:
        return self.value in _LAZY

    def is_eager_allowed(self) -> bool:
        return self.value not in (_LAZY - {Impl.POLARS, "polars"})


_BACKENDS: Final = (
    Backend("polars"),
    Backend("pyarrow"),
    Backend("pandas"),
    Backend("modin", "modin.pandas", Warn.COPY),
    Backend("ibis", warn=Warn.ALL),
    Backend("duckdb", warn=Warn.ALL),
    Backend("dask", "dask.dataframe", Warn.ALL),
)


@pytest.fixture(
    scope="session",
    params=tuple(b for b in _BACKENDS if b.is_eager_allowed() and b.is_available()),
    ids=str,
)
def eager(request: Request) -> Backend[EagerAllowed]:
    backend: Backend[EagerAllowed] = request.param
    return backend


@pytest.fixture(
    scope="session",
    params=tuple(b for b in _BACKENDS if b.is_lazy_allowed() and b.is_available()),
    ids=str,
)
def lazy(request: Request) -> Backend[LazyAllowed]:
    backend: Backend[LazyAllowed] = request.param
    return backend


# TODO @dangotbanned: Fix `modin` warnings
# - `from_dict`
# - `attrs` False positive caused by `if hasattr(df, "attrs")` in https://github.com/apache/arrow/pull/47147
@pytest.fixture(scope="session")
def nw_dataframe(eager: Backend[EagerAllowed]) -> DataFrameConstructor:
    return partial(nw.DataFrame.from_dict, backend=eager.value)
