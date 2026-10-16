from __future__ import annotations

from typing import TYPE_CHECKING, TypeAlias, TypedDict
from typing import Literal as L  # ruff: ignore[camelcase-imported-as-acronym]

import narwhals as nw
import pytest

from mosaic_widget import MosaicWidget

if TYPE_CHECKING:
    from pathlib import Path


class DataParquet(TypedDict):
    type: L["parquet"]
    file: str


DataDefs: TypeAlias = dict[str, DataParquet]


def parquet(name: str, file: Path) -> DataDefs:
    return {name: {"type": "parquet", "file": file.as_posix()}}


@pytest.fixture(scope="module")
def widget(data_dir: Path) -> MosaicWidget:
    real_path = data_dir / "berlin-covid.parquet"
    assert real_path.exists(), "expected a small file"
    fake_path = data_dir / "nope-nope-nope-123.parquet"
    assert fake_path.exists() is False, "why did you create this?"

    table = nw.read_parquet(real_path, backend="pyarrow").to_arrow()

    spec_data = {
        "data": parquet("real-spec", real_path) | parquet("fake-spec", fake_path)
    }
    return MosaicWidget(spec_data, None, {"real-frame": table})
