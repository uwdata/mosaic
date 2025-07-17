import logging

import pytest
from narwhals.typing import Frame

from mosaic_widget.frame_interop import frame_to_duckdb_registrable

CSV_PATH = "../../../data/seattle-weather.csv"


@pytest.fixture
def dask_frame() -> Frame:
    import dask.dataframe as dd

    return dd.read_csv(CSV_PATH, parse_dates=["date"])


@pytest.fixture
def duckdb_frame() -> Frame:
    import duckdb

    return duckdb.query(f"select * from '{CSV_PATH}'")


@pytest.fixture
def ibis_frame() -> Frame:
    import ibis

    return ibis.read_csv(CSV_PATH)


@pytest.fixture
def modin_frame() -> Frame:
    import os

    import modin.pandas as md

    os.environ["MODIN_ENGINE"] = "python"
    os.environ["MODIN_STORAGE_FORMAT"] = "pandas"
    return md.read_csv(CSV_PATH, parse_dates=["date"])


@pytest.fixture
def pandas_frame() -> Frame:
    import pandas as pd

    return pd.read_csv(CSV_PATH, parse_dates=["date"])


@pytest.fixture
def pyarrow_frame(pandas_frame):
    import pyarrow as pa

    return pa.Table.from_pandas(pandas_frame)


@pytest.fixture
def polars_frame() -> Frame:
    import polars as pl

    return pl.read_csv(CSV_PATH, try_parse_dates=True)


@pytest.fixture
def frame(request: pytest.FixtureRequest) -> Frame:
    """Indirect fixture to handle parameterized frame types."""
    return request.getfixturevalue(request.param)


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


@pytest.mark.parametrize(
    "frame",
    [
        ("pandas_frame"),
        ("polars_frame"),
        ("pyarrow_frame"),
    ],
    indirect=["frame"],
)
def test_frame_to_duckdb_registrable_native(
    frame: Frame,
    caplog: pytest.LogCaptureFixture,
):
    assert frame_to_duckdb_registrable(frame) is not None

    # Native frames should not produce warnings
    assert not materializing_lazy_frame_warning_emitted(caplog)
    assert not zero_copy_warning_emitted(caplog)


@pytest.mark.parametrize(
    "frame",
    [
        ("modin_frame"),
    ],
    indirect=["frame"],
)
def test_frame_to_duckdb_registrable_eager(
    frame: Frame,
    caplog: pytest.LogCaptureFixture,
):
    assert frame_to_duckdb_registrable(frame) is not None

    # Eager frames should warn about potential non-zero-copy operations but not about materializing lazy frames
    assert not materializing_lazy_frame_warning_emitted(caplog)
    assert zero_copy_warning_emitted(caplog)


@pytest.mark.parametrize(
    "frame",
    [
        ("dask_frame"),
        ("duckdb_frame"),
        ("ibis_frame"),
    ],
    indirect=["frame"],
)
def test_frame_to_duckdb_registrable_lazy(
    frame: Frame,
    caplog: pytest.LogCaptureFixture,
):
    assert frame_to_duckdb_registrable(frame) is not None

    # Lazy frames should warn both about materializing and potential non-zero-copy operations
    assert materializing_lazy_frame_warning_emitted(caplog)
    assert zero_copy_warning_emitted(caplog)
