from __future__ import annotations

from typing import TYPE_CHECKING, Any

import pytest

from mosaic_widget import MosaicWidget

if TYPE_CHECKING:
    from .conftest import Data, DataFrameConstructor, NwDataFrame


class SpecWithContext:
    """Stand-in for a vgplot View: to_dict() accepts the caller frame locals."""

    def __init__(self) -> None:
        self.received_context = None

    def to_dict(self, _context=None):
        self.received_context = _context
        return {"plot": [], "seen": "context"}


class SpecWithoutContext:
    """Stand-in for a vgplot Spec: to_dict() takes no _context argument."""

    def to_dict(self):
        return {"plot": [], "seen": "plain"}


def test_dict_spec_is_used_as_is() -> None:
    spec = {"plot": [{"mark": "dot"}]}
    widget = MosaicWidget(spec)
    assert widget.spec == spec


def test_spec_object_with_context_receives_caller_locals() -> None:
    marker = object()  # noqa: F841 -- discoverable in the caller frame
    spec_obj = SpecWithContext()
    widget = MosaicWidget(spec_obj)

    assert widget.spec == {"plot": [], "seen": "context"}
    # The caller frame locals were threaded through to to_dict().
    assert spec_obj.received_context is not None
    assert any(v is marker for v in spec_obj.received_context.values())


# NOTE: Reporting a diagnostic is correct, because the implementation accepts this object by catching a `TypeError`
def test_spec_object_without_context_falls_back() -> None:
    widget = MosaicWidget(SpecWithoutContext())  # pyright: ignore[reportArgumentType]  # ty:ignore[invalid-argument-type]
    assert widget.spec == {"plot": [], "seen": "plain"}


def test_object_without_to_dict_raises() -> None:
    with pytest.raises(TypeError, match="to_dict"):
        # An object without to_dict() is intentionally invalid input.
        MosaicWidget(object())  # pyright: ignore[reportArgumentType] # ty: ignore[invalid-argument-type]


class FrameDataSpec:
    """Stand-in for a vgplot View whose data section holds in-memory frames.

    vgplot routes DataFrames into the spec's ``data`` section keyed by name;
    marks reference them by name. The widget's job is to register the frames.
    """

    def __init__(self, data: dict[str, Any]) -> None:
        self._data = data

    def to_dict(self, *, _context=None):
        marks = [{"mark": "dot", "data": {"from": name}} for name in self._data]
        return {"plot": marks, "data": dict(self._data)}


@pytest.fixture
def frame_data() -> Data:
    return {"a": [1, 2, 3]}


@pytest.fixture
def frame(nw_dataframe: DataFrameConstructor, frame_data: Data) -> NwDataFrame:
    return nw_dataframe(frame_data)


def test_frame_in_data_section_is_registered(frame: NwDataFrame) -> None:
    widget = MosaicWidget(FrameDataSpec({"weather": frame.to_native()}))

    # The frame is pulled out of the synced spec; the mark reference stays.
    assert widget.spec == {"plot": [{"mark": "dot", "data": {"from": "weather"}}]}
    assert "weather" in widget._registered_tables

    pytest.importorskip("pandas")
    assert len(widget.con.query("select * from weather").df()) == 3


def test_serializable_data_entries_are_kept(frame: NwDataFrame) -> None:
    file_def = {"type": "csv", "file": "athletes.csv"}
    widget = MosaicWidget(
        FrameDataSpec({"weather": frame.to_native(), "athletes": file_def})
    )

    # File-backed data stays in the spec; only the in-memory frame is registered.
    assert widget.spec["data"] == {"athletes": file_def}
    assert widget._registered_tables == {"weather"}


# TODO @dangotbanned: Need an alternative to materializing as pandas
# - E.g. Map `Implementation` -> `DuckDBPy{Connection,Relation}` export methods
def test_explicit_data_takes_precedence(frame: NwDataFrame) -> None:
    weather = frame.to_native()
    override = frame.head(1).to_native()
    widget = MosaicWidget(
        FrameDataSpec({"weather": weather}), data={"weather": override}
    )

    pytest.importorskip("pandas")
    assert len(widget.con.query("select * from weather").df()) == 1
