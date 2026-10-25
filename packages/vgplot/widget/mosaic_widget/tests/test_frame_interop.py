from __future__ import annotations

from typing import TYPE_CHECKING

import narwhals as nw
import pytest

from mosaic_widget import MosaicWidget

if TYPE_CHECKING:
    from pathlib import Path

    import pyarrow as pa

    from .conftest import Backend, EagerAllowed, LazyAllowed, NativeLazyFrame


@pytest.fixture(scope="module")
def pyarrow_frame(data_dir: Path) -> nw.DataFrame[pa.Table]:
    # NOTE: `pyarrow` is the single source because:
    # - All other backends support it natively
    # - `read_csv` infers temporal columns by default
    # - `seattle-weather.csv` contains a `date`-typed column
    #   - but numpy-based type systems will use `datetime`
    #   - `pandas` can understand `date` iff it is backed by pyarrow
    path = (data_dir / "seattle-weather.csv").as_posix()
    return nw.read_csv(path, backend="pyarrow")


def test_frame_to_duckdb_registrable_eager(
    pyarrow_frame: nw.DataFrame[pa.Table], eager: Backend[EagerAllowed]
) -> None:
    frame = nw.from_arrow(pyarrow_frame, backend=eager.value).to_native()
    with eager.warn.context():
        widget = MosaicWidget(None, None, {"tbl": frame})
        assert widget is not None


def test_frame_to_duckdb_registrable_lazy(
    pyarrow_frame: nw.DataFrame[pa.Table], lazy: Backend[LazyAllowed]
) -> None:
    frame: NativeLazyFrame = pyarrow_frame.lazy(lazy.value).to_native()
    with lazy.warn.context():
        widget = MosaicWidget(None, None, {"tbl": frame})
        assert widget is not None
