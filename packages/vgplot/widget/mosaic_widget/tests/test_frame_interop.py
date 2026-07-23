from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import narwhals as nw
import pytest

from mosaic_widget.frame_interop import frame_to_duckdb_registrable

from .conftest import Warn

if TYPE_CHECKING:
    import pyarrow as pa
    from pytest import LogCaptureFixture as LogCapture

    from .conftest import Backend, EagerAllowed, LazyAllowed, NativeLazyFrame

CSV_PATH = "../../../data/seattle-weather.csv"


@pytest.fixture(scope="module")
def pyarrow_frame() -> nw.DataFrame[pa.Table]:
    # NOTE: `pyarrow` is the single source because:
    # - All other backends support it natively
    # - `read_csv` infers temporal columns by default
    # - `seattle-weather.csv` contains a `date`-typed column
    #   - but numpy-based type systems will use `datetime`
    #   - `pandas` can understand `date` iff it is backed by pyarrow
    return nw.read_csv(CSV_PATH, backend="pyarrow")


@pytest.fixture
def caplog(caplog: LogCapture) -> LogCapture:
    caplog.set_level(logging.WARNING)
    return caplog


def check_warns(caplog: LogCapture, warn: Warn) -> None:
    copy = "This may not be a zero-copy operation"
    materialize = "Materializing lazy frame"
    warn_copy = any(copy in msg for msg in caplog.messages)
    warn_materialize = any(materialize in msg for msg in caplog.messages)
    match warn:
        case Warn.ALL:
            assert warn_copy and warn_materialize
        case Warn.COPY:
            assert warn_copy and not warn_materialize
        case Warn.MATERIALIZE:
            assert not warn_copy and warn_materialize
        case _:
            assert not (warn_copy or warn_materialize)


def test_frame_to_duckdb_registrable_eager(
    pyarrow_frame: nw.DataFrame[pa.Table],
    eager: Backend[EagerAllowed],
    caplog: LogCapture,
) -> None:
    frame = nw.from_arrow(pyarrow_frame, backend=eager.value).to_native()
    assert frame_to_duckdb_registrable(frame) is not None
    check_warns(caplog, eager.warn)


def test_frame_to_duckdb_registrable_lazy(
    pyarrow_frame: nw.DataFrame[pa.Table],
    lazy: Backend[LazyAllowed],
    caplog: LogCapture,
) -> None:
    frame: NativeLazyFrame = pyarrow_frame.lazy(lazy.value).to_native()
    assert frame_to_duckdb_registrable(frame) is not None
    check_warns(caplog, lazy.warn)
