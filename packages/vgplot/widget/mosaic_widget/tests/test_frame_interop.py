import logging

import pytest
from narwhals.typing import IntoFrame

from mosaic_widget.frame_interop import frame_to_duckdb_registrable

CSV_PATH = "../../../data/seattle-weather.csv"


@pytest.fixture
def dask_frame() -> IntoFrame:
    import dask.dataframe as dd

    return dd.read_csv(CSV_PATH, parse_dates=["date"])


@pytest.fixture
def duckdb_frame() -> IntoFrame:
    import duckdb

    return duckdb.query(f"select * from '{CSV_PATH}'")


@pytest.fixture
def ibis_frame() -> IntoFrame:
    import ibis

    return ibis.read_csv(CSV_PATH)


@pytest.fixture
def modin_frame() -> IntoFrame:
    import os

    import modin.pandas as md

    os.environ["MODIN_ENGINE"] = "python"
    os.environ["MODIN_STORAGE_FORMAT"] = "pandas"
    return md.read_csv(CSV_PATH, parse_dates=["date"])


@pytest.fixture
def pandas_frame() -> IntoFrame:
    import pandas as pd

    return pd.read_csv(CSV_PATH, parse_dates=["date"])


@pytest.fixture
def pyarrow_frame(pandas_frame: IntoFrame) -> IntoFrame:
    import pyarrow as pa

    return pa.Table.from_pandas(pandas_frame)


@pytest.fixture
def polars_frame() -> IntoFrame:
    import polars as pl

    return pl.read_csv(CSV_PATH, try_parse_dates=True)


@pytest.fixture
def frame(request: pytest.FixtureRequest) -> IntoFrame:
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
    frame: IntoFrame,
    caplog: pytest.LogCaptureFixture,
):
    assert frame_to_duckdb_registrable(frame) is not None

    # Converting frames supported by DuckDB natively should not emit warnings
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
    frame: IntoFrame,
    caplog: pytest.LogCaptureFixture,
):
    assert frame_to_duckdb_registrable(frame) is not None

    # Converting non-native eager frames should warn about potential non-zero-copy operations but not about materializing lazy frames
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
    frame: IntoFrame,
    caplog: pytest.LogCaptureFixture,
):
    assert frame_to_duckdb_registrable(frame) is not None

    # Converting lazy frames should warn both about materializing and potential non-zero-copy operations
    assert materializing_lazy_frame_warning_emitted(caplog)
    assert zero_copy_warning_emitted(caplog)
