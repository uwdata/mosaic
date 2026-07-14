import pytest

from mosaic_widget import MosaicWidget


class SpecWithContext:
    """Stand-in for a vgplot View: to_dict() accepts the caller frame locals."""

    def __init__(self):
        self.received_context = None

    def to_dict(self, _context=None):
        self.received_context = _context
        return {"plot": [], "seen": "context"}


class SpecWithoutContext:
    """Stand-in for a vgplot Spec: to_dict() takes no _context argument."""

    def to_dict(self):
        return {"plot": [], "seen": "plain"}


def test_dict_spec_is_used_as_is():
    spec = {"plot": [{"mark": "dot"}]}
    widget = MosaicWidget(spec)
    assert widget.spec == spec


def test_spec_object_with_context_receives_caller_locals():
    marker = object()  # noqa: F841 -- discoverable in the caller frame
    spec_obj = SpecWithContext()
    widget = MosaicWidget(spec_obj)

    assert widget.spec == {"plot": [], "seen": "context"}
    # The caller frame locals were threaded through to to_dict().
    assert spec_obj.received_context is not None
    assert any(v is marker for v in spec_obj.received_context.values())


def test_spec_object_without_context_falls_back():
    widget = MosaicWidget(SpecWithoutContext())
    assert widget.spec == {"plot": [], "seen": "plain"}


def test_object_without_to_dict_raises():
    with pytest.raises(TypeError, match="to_dict"):
        # An object without to_dict() is intentionally invalid input.
        MosaicWidget(object())  # ty: ignore[invalid-argument-type]


class FrameDataSpec:
    """Stand-in for a vgplot View whose data section holds in-memory frames.

    vgplot routes DataFrames into the spec's ``data`` section keyed by name;
    marks reference them by name. The widget's job is to register the frames.
    """

    def __init__(self, data):
        self._data = data

    def to_dict(self, _context=None):
        marks = [{"mark": "dot", "data": {"from": name}} for name in self._data]
        return {"plot": marks, "data": dict(self._data)}


@pytest.fixture
def pandas_frame():
    import pandas as pd

    return pd.DataFrame({"a": [1, 2, 3]})


@pytest.fixture
def polars_frame():
    import polars as pl

    return pl.DataFrame({"a": [1, 2, 3]})


@pytest.mark.parametrize("frame_fixture", ["pandas_frame", "polars_frame"])
def test_frame_in_data_section_is_registered(frame_fixture, request):
    weather = request.getfixturevalue(frame_fixture)
    widget = MosaicWidget(FrameDataSpec({"weather": weather}))

    # The frame is pulled out of the synced spec; the mark reference stays.
    assert widget.spec == {"plot": [{"mark": "dot", "data": {"from": "weather"}}]}
    assert "weather" in widget._registered_tables
    assert len(widget.con.query("select * from weather").df()) == 3


def test_serializable_data_entries_are_kept(pandas_frame):
    file_def = {"type": "csv", "file": "athletes.csv"}
    widget = MosaicWidget(
        FrameDataSpec({"weather": pandas_frame, "athletes": file_def})
    )

    # File-backed data stays in the spec; only the in-memory frame is registered.
    assert widget.spec["data"] == {"athletes": file_def}
    assert widget._registered_tables == {"weather"}


def test_explicit_data_takes_precedence(pandas_frame):
    override = pandas_frame.iloc[:1]
    widget = MosaicWidget(
        FrameDataSpec({"weather": pandas_frame}), data={"weather": override}
    )

    assert len(widget.con.query("select * from weather").df()) == 1
