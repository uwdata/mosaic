from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

import narwhals as nw
import pytest

from mosaic_widget.frame_interop import frame_to_duckdb_registrable

if TYPE_CHECKING:
    import pyarrow as pa

    from .conftest import Backend, EagerAllowed, LazyAllowed, NativeLazyFrame

ROOT = Path(__file__).parent.parent.parent.parent.parent.parent
CSV_PATH = (ROOT / "data/seattle-weather.csv").as_posix()


@pytest.fixture(scope="module")
def pyarrow_frame() -> nw.DataFrame[pa.Table]:
    # NOTE: `pyarrow` is the single source because:
    # - All other backends support it natively
    # - `read_csv` infers temporal columns by default
    # - `seattle-weather.csv` contains a `date`-typed column
    #   - but numpy-based type systems will use `datetime`
    #   - `pandas` can understand `date` iff it is backed by pyarrow
    return nw.read_csv(CSV_PATH, backend="pyarrow")


def test_frame_to_duckdb_registrable_eager(
    pyarrow_frame: nw.DataFrame[pa.Table], eager: Backend[EagerAllowed]
) -> None:
    frame = nw.from_arrow(pyarrow_frame, backend=eager.value).to_native()
    with eager.warn.context():
        assert frame_to_duckdb_registrable(frame) is not None


def test_frame_to_duckdb_registrable_lazy(
    pyarrow_frame: nw.DataFrame[pa.Table], lazy: Backend[LazyAllowed]
) -> None:
    frame: NativeLazyFrame = pyarrow_frame.lazy(lazy.value).to_native()
    with lazy.warn.context():
        assert frame_to_duckdb_registrable(frame) is not None
