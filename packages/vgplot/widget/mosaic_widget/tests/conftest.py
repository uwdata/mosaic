from __future__ import annotations

from collections.abc import Callable, Mapping, Sequence
from functools import partial
from importlib.util import find_spec
from typing import TYPE_CHECKING, Any, Final, Literal, TypeAlias

import narwhals as nw
import pytest
from narwhals import Implementation as Impl
from pytest import FixtureRequest as Request

if TYPE_CHECKING:
    import dask.dataframe as dd
    import duckdb
    import ibis
    import modin.pandas as mpd
    import pandas as pd
    import polars as pl
    import pyarrow as pa
    from narwhals.typing import EagerAllowed, LazyAllowed

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

LazyOnly: TypeAlias = Literal[Impl.IBIS, Impl.DUCKDB, Impl.DASK]

_EAGER: Final[Mapping[str, EagerAllowed]] = {
    "polars": Impl.POLARS,
    "pyarrow": Impl.PYARROW,
    "pandas": Impl.PANDAS,
    "modin.pandas": Impl.MODIN,
}
_LAZY: Final[Mapping[str, LazyAllowed]] = {
    "polars": Impl.POLARS,
    "ibis": Impl.IBIS,
    "duckdb": Impl.DUCKDB,
    "dask.dataframe": Impl.DASK,
}


@pytest.fixture(
    scope="session", params=tuple(v for k, v in _EAGER.items() if find_spec(k))
)
def eager(request: Request) -> EagerAllowed:
    backend: EagerAllowed = request.param
    return backend


# TODO @dangotbanned: Either use this somewhere or remove
@pytest.fixture(
    scope="session", params=tuple(v for k, v in _LAZY.items() if find_spec(k))
)
def lazy(request: Request) -> LazyAllowed:
    backend: LazyAllowed = request.param
    return backend


@pytest.fixture(
    scope="session",
    params=tuple(v for k, v in _LAZY.items() if v is not Impl.POLARS and find_spec(k)),
)
def lazy_only(request: Request) -> LazyOnly:
    backend: LazyOnly = request.param
    return backend


# TODO @dangotbanned: Fix `modin` warnings
# - `from_dict`
# - `attrs` False positive caused by `if hasattr(df, "attrs")` in https://github.com/apache/arrow/pull/47147
@pytest.fixture(scope="session")
def nw_dataframe(eager: EagerAllowed) -> DataFrameConstructor:
    return partial(nw.DataFrame.from_dict, backend=eager)
