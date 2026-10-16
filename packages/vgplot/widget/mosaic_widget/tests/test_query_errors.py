from __future__ import annotations

import re
from types import MethodType
from typing import TYPE_CHECKING
from typing import Literal as L  # ruff: ignore[camelcase-imported-as-acronym]

import duckdb
import pytest

from mosaic_widget import MosaicWidget, _QueryParams

if TYPE_CHECKING:
    from pathlib import Path


@pytest.fixture(scope="module")
def widget() -> MosaicWidget:
    """A widget that surfaces errors, removing a [decorator] that swallows them.

    [decorator]. https://github.com/jupyter-widgets/ipywidgets/commit/e3e7da4cc14e62681a40cecf8b6e8a0918ef38b5
    """
    widget = MosaicWidget()
    unwrapped_method = widget._handle_msg.__func__.__closure__[0].cell_contents
    assert unwrapped_method.__name__ == "_handle_msg"
    widget._handle_msg = MethodType(unwrapped_method, widget)
    return widget


def send_message(widget: MosaicWidget, sql: str, type: L["arrow", "exec"]) -> None:
    """Construct a message and send it into where the frontend calls."""
    data = {"method": "custom", "content": _QueryParams(type=type, sql=sql, uuid="1")}
    msg = {"content": {"data": data}, "buffers": []}
    widget._handle_msg(msg)


def query(table_name: str, path: Path) -> str:
    return f"CREATE TABLE '{table_name}' AS SELECT * FROM read_parquet({path.as_posix()!r})"


def test_real_file_does_not_raise(widget: MosaicWidget, data_dir: Path) -> None:
    send_message(widget, query("real-1", data_dir / "berlin-covid.parquet"), "exec")


def test_missing_file_raises(widget: MosaicWidget, data_dir: Path) -> None:
    name = "nope-nope-nope-123.parquet"
    sql = query("fake-1", data_dir / name)
    pattern = re.compile(rf"no files.+{name}", re.IGNORECASE | re.DOTALL)
    with pytest.raises(duckdb.IOException, match=pattern):
        send_message(widget, sql, "exec")
