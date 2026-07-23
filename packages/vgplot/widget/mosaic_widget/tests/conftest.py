from __future__ import annotations

from collections.abc import Callable, Mapping, Sequence
from functools import partial
from importlib.util import find_spec
from typing import TYPE_CHECKING, Any, TypeAlias

import narwhals as nw
import pytest

if TYPE_CHECKING:
    from collections.abc import Iterator

    import modin.pandas as mpd
    import pandas as pd
    import polars as pl
    import pyarrow as pa
    from narwhals.typing import EagerAllowed

    NativeDataFrame: TypeAlias = pa.Table | pd.DataFrame | pl.DataFrame | mpd.DataFrame


Data: TypeAlias = Mapping[str, Sequence[Any]]
"""Columnar data for a dataframe backend."""

NwDataFrame: TypeAlias = nw.DataFrame["NativeDataFrame"]
"""A constructed [`narwhals.DataFrame`][], with a known backend."""

DataFrameConstructor: TypeAlias = Callable[[Data], NwDataFrame]
"""A constructor for a [`narwhals.DataFrame`][]."""


@pytest.fixture(scope="session")
def pd_dataframe() -> type[pd.DataFrame]:
    pytest.importorskip("pandas")
    import pandas as pd

    return pd.DataFrame


# TODO @dangotbanned: Fix `modin` warnings
# - `from_dict`
# - `attrs` False positive caused by `if hasattr(df, "attrs")` in https://github.com/apache/arrow/pull/47147
def _eager_backends() -> Iterator[EagerAllowed]:
    if find_spec("polars"):
        yield nw.Implementation.POLARS
    if find_spec("pyarrow"):
        yield nw.Implementation.PYARROW
    if find_spec("pandas"):
        yield nw.Implementation.PANDAS
        if find_spec("modin.pandas"):
            yield nw.Implementation.MODIN


@pytest.fixture(scope="session", params=tuple(_eager_backends()))
def nw_dataframe(request: pytest.FixtureRequest) -> DataFrameConstructor:
    backend: EagerAllowed = request.param
    return partial(nw.DataFrame.from_dict, backend=backend)
