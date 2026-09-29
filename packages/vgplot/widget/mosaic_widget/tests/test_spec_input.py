from __future__ import annotations

from typing import TYPE_CHECKING, Any

import duckdb
import pytest
from duckdb import DuckDBPyConnection as Con
from duckdb import DuckDBPyRelation as Rel

from mosaic_widget import MosaicWidget

if TYPE_CHECKING:
    from collections.abc import Iterator

    from _pytest.mark import ParameterSet

    from .conftest import (
        Data,
        DataFrameConstructor,
        LazyFrameConstructor,
        NwDataFrame,
        NwLazyFrame,
    )


class SpecWithContext:
    """Stand-in for a vgplot View: to_dict() accepts the caller frame locals."""

    def __init__(self) -> None:
        self.received_context: dict[str, Any] | None = None

    def to_dict(self, _context: dict[str, Any] | None = None) -> dict[str, Any]:
        self.received_context = _context
        return {"plot": [], "seen": "context"}


class SpecWithoutContext:
    """Stand-in for a vgplot Spec: to_dict() takes no _context argument."""

    def to_dict(self) -> dict[str, Any]:
        return {"plot": [], "seen": "plain"}


def test_dict_spec_is_used_as_is() -> None:
    spec = {"plot": [{"mark": "dot"}]}
    widget = MosaicWidget(spec)
    assert widget.spec == spec


def test_spec_object_with_context_receives_caller_locals() -> None:
    marker = object()
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
        self._data: dict[str, Any] = data

    def to_dict(self, *, _context: dict[str, Any] | None = None) -> dict[str, Any]:
        marks = [{"mark": "dot", "data": {"from": name}} for name in self._data]
        return {"plot": marks, "data": dict(self._data)}


@pytest.fixture
def frame_data() -> Data:
    return {"a": [1, 2, 3]}


@pytest.fixture
def frame(nw_dataframe: DataFrameConstructor, frame_data: Data) -> NwDataFrame:
    return nw_dataframe(frame_data)


@pytest.fixture
def lazyframe(nw_lazyframe: LazyFrameConstructor, frame_data: Data) -> NwLazyFrame:
    return nw_lazyframe(frame_data)


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


@pytest.mark.filterwarnings("ignore::mosaic_widget._exceptions.PerformanceWarning")
def test_lazyframe_registered(lazyframe: NwLazyFrame) -> None:
    native = lazyframe.to_native()
    widget = MosaicWidget(FrameDataSpec({"weather": native}))
    assert widget.spec == {"plot": [{"mark": "dot", "data": {"from": "weather"}}]}
    assert "weather" in widget._registered_tables
    assert len(widget.con.query("select * from weather").to_arrow_table()) == 3


def _generate_relations_and_connections(data: dict[str, int]) -> Iterator[ParameterSet]:
    query = f"SELECT unnest({data!r})"

    memory_unique = duckdb.connect()
    memory_db_name = ":memory:mosaic1"
    named_1 = duckdb.connect(memory_db_name)
    named_2 = duckdb.connect(memory_db_name)

    requires_roundtrip = pytest.mark.filterwarnings(
        "ignore::mosaic_widget._exceptions.PerformanceWarning"
    )

    yield pytest.param(duckdb.sql(query), None, id="global-no-connection")
    yield pytest.param(
        duckdb.sql(query), duckdb.default_connection(), id="global-default-connection"
    )
    yield pytest.param(
        memory_unique.sql(query),
        None,
        marks=requires_roundtrip,
        id="memory-no-connection",
    )
    yield pytest.param(
        memory_unique.sql(query), memory_unique, id="memory-same-connection"
    )
    yield pytest.param(
        memory_unique.sql(query),
        duckdb.connect(),
        marks=requires_roundtrip,
        id="memory-wrong-database",
    )
    yield pytest.param(
        named_1.sql(query),
        named_2,
        marks=requires_roundtrip,
        id="named-memory-wrong-connection",
    )
    yield pytest.param(named_1.sql(query), named_1, id="named-memory-same-connection")
    yield pytest.param(
        named_1.sql(query),
        named_1.cursor(),
        marks=requires_roundtrip,
        id="named-memory-cursor",
    )
    cursor = named_1
    yield pytest.param(cursor.sql(query), cursor, id="named-memory-cursor-only")


@pytest.mark.parametrize(
    ("rel", "con"), list(_generate_relations_and_connections({"a": 42, "b": 84}))
)
def test_duckdb_relation_origin_1296(rel: Rel, con: Con | None) -> None:
    # https://github.com/uwdata/mosaic/issues/1296
    spec = FrameDataSpec({"tbl": rel})
    widget = MosaicWidget(spec, con)
    result = widget.con.sql("from tbl").to_arrow_table().to_pydict()
    expected = {"a": [42], "b": [84]}
    assert result == expected
