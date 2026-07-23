from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING

import narwhals as nw
import pytest
from narwhals import Implementation as Impl

from mosaic_widget.frame_interop import frame_to_duckdb_registrable

if TYPE_CHECKING:
    from collections.abc import Mapping

    import pyarrow as pa

    from .conftest import EagerAllowed, LazyOnly, NativeLazyFrame

# NOTE: Revert this before pushing, fix in another PR
ROOT = Path(__file__).parent.parent.parent.parent.parent.parent
CSV_PATH = (ROOT / "data/seattle-weather.csv").as_posix()


# TODO @dangotbanned: Add doc, explain why (avoiding multiple csv readers)
@pytest.fixture(scope="module")
def seattle_weather() -> nw.DataFrame[pa.Table]:
    return nw.read_csv(CSV_PATH, backend="pyarrow")


@pytest.fixture
def caplog(caplog: pytest.LogCaptureFixture) -> pytest.LogCaptureFixture:
    caplog.set_level(logging.WARNING)
    return caplog


def zero_copy_warning_emitted(caplog: pytest.LogCaptureFixture) -> bool:
    return any(
        "This may not be a zero-copy operation" in record.message
        for record in caplog.records
    )


def materializing_lazy_frame_warning_emitted(caplog: pytest.LogCaptureFixture) -> bool:
    return any(
        "Materializing lazy frame" in record.message for record in caplog.records
    )


def test_frame_to_duckdb_registrable_eager(
    seattle_weather: nw.DataFrame[pa.Table],
    eager: EagerAllowed,
    caplog: pytest.LogCaptureFixture,
) -> None:
    zero_copy: Mapping[EagerAllowed, bool] = {
        Impl.POLARS: True,
        Impl.PYARROW: True,
        Impl.PANDAS: True,
        Impl.MODIN: False,
    }
    frame = nw.from_arrow(seattle_weather, backend=eager).to_native()
    should_warn = not (zero_copy[eager])
    assert frame_to_duckdb_registrable(frame) is not None

    # Converting non-native eager frames should warn about potential non-zero-copy operations but not about materializing lazy frames
    assert not materializing_lazy_frame_warning_emitted(caplog)
    assert zero_copy_warning_emitted(caplog) == should_warn


def test_frame_to_duckdb_registrable_lazy(
    seattle_weather: nw.DataFrame[pa.Table],
    lazy_only: LazyOnly,
    caplog: pytest.LogCaptureFixture,
) -> None:
    frame: NativeLazyFrame = seattle_weather.lazy(lazy_only).to_native()
    assert frame_to_duckdb_registrable(frame) is not None

    # Converting lazy frames should warn both about materializing and potential non-zero-copy operations
    assert materializing_lazy_frame_warning_emitted(caplog)
    assert zero_copy_warning_emitted(caplog)
