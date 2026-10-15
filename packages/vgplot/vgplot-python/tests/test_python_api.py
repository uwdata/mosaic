# Unit tests for the vgplot Python API, covering behaviors that the
# generated-spec round-trip suite does not exercise directly.
from __future__ import annotations

import json
from collections import deque
from typing import TYPE_CHECKING

import pytest
import vgplot as vg
from vgplot.plot import Mark

if TYPE_CHECKING:
    from vgplot._types import TableName


class TestGeneratedMarks:
    """Marks are generated from the schema; there is no dynamic fallback, so
    unknown names fail loudly rather than being silently fabricated."""

    def test_positional_data_with_encodings_is_kept(self) -> None:
        # A leading positional arg is the data source even when the call also
        # has keyword encodings.
        mark = vg.waffle_y("athletes", x="a", y={"count": ""})
        assert isinstance(mark, Mark)
        d = mark.to_dict()
        assert d["mark"] == "waffleY"
        assert d["data"] == {"from": "athletes"}
        assert d["x"] == "a"

    def test_explicit_none_channel_is_preserved(self) -> None:
        # Passing a channel explicitly as None keeps it in the output (distinct
        # from not passing it at all).
        assert vg.line_y("t", x="a", z=None).to_dict()["z"] is None
        assert "z" not in vg.line_y("t", x="a").to_dict()

    def test_unknown_name_raises(self) -> None:
        # No __getattr__ fallback: a missing or mis-typed API name is an error.
        with pytest.raises(AttributeError):
            _ = vg.some_custom_mark  # pyright: ignore[reportAttributeAccessIssue] # ty: ignore[unresolved-attribute]
        with pytest.raises(AttributeError):
            _ = vg.definitely_not_a_real_directive  # pyright: ignore[reportAttributeAccessIssue] # ty: ignore[unresolved-attribute]


class TestDataHelpers:
    def test_json_inline_data(self) -> None:
        d = vg.json([{"a": 1}, {"a": 2}])
        assert d.to_dict() == {"type": "json", "data": [{"a": 1}, {"a": 2}]}

    def test_json_file(self) -> None:
        assert vg.json(file="x.json").to_dict() == {"type": "json", "file": "x.json"}


class TestSource:
    """`vg.source` names a table as a string or, for a schema-qualified table,
    as a sequence of identifiers that serializes to a JSON array."""

    def test_string_name(self) -> None:
        assert vg.source("test_table").to_dict() == {"from": "test_table"}
        assert vg.source("test_table", filter_by="$sel").to_dict() == {
            "from": "test_table",
            "filterBy": "$sel",
        }

    @pytest.mark.parametrize(
        "name",
        [
            ["test_schema", "test_table"],
            ("test_schema", "test_table"),
            deque(["test_schema", "test_table"]),
        ],
        ids=["list", "tuple", "deque"],
    )
    def test_qualified_name_sequences(self, name: TableName) -> None:
        ref = vg.source(name)
        # str is itself a Sequence[str]; other sequences are normalized to a
        # plain list so the reference is JSON-shaped without json.dumps coercion.
        assert ref.name == ["test_schema", "test_table"]
        assert isinstance(ref.name, list)
        assert ref.to_dict() == {"from": ["test_schema", "test_table"]}

    def test_qualified_name_as_mark_data(self) -> None:
        d = vg.dot(vg.source(("test_schema", "test_table")), x="a").to_dict()
        assert d["data"] == {"from": ["test_schema", "test_table"]}

    def test_qualified_name_serializes_to_json(self) -> None:
        ref = vg.source(deque(["test_schema", "test_table"]))
        view = vg.plot(vg.dot(ref, x="a"))
        payload = json.loads(json.dumps(view.to_dict()))
        assert payload["plot"][0]["data"] == {"from": ["test_schema", "test_table"]}

    def test_bare_list_as_mark_data_is_inline_data(self) -> None:
        rows = [{"a": 1}, {"a": 2}]
        assert vg.dot(rows, x="a").to_dict()["data"] == rows

    def test_qualified_name_as_input_source(self) -> None:
        d = vg.menu(source=["test_schema", "test_table"], column="test_column")
        assert d.to_dict()["from"] == ["test_schema", "test_table"]


class TestParams:
    def test_date_param(self) -> None:
        from datetime import date

        assert vg.param(date(2013, 5, 13)).param_def() == {"date": "2013-05-13"}

    def test_datetime_param(self) -> None:
        from datetime import datetime

        assert vg.param(datetime(2013, 5, 13, 10, 30)).param_def() == {  # ruff: ignore[call-datetime-without-tzinfo]
            "date": "2013-05-13T10:30:00"
        }


class TestAutoNaming:
    def test_auto_param_name_skips_explicit_name(self) -> None:
        from vgplot.spec import Spec

        named = vg.param(1)
        unnamed = vg.param(2)
        view = vg.plot(vg.dot("t", x=unnamed))
        # The explicit param already occupies "_param0"; the in-view param must
        # not collide with it.
        d = Spec(params={"_param0": named}, view=view).to_dict()
        assert d["params"]["_param0"] == 1
        assert d["params"]["_param1"] == 2
        assert d["plot"][0]["x"] == "$_param1"


class TestDataFrames:
    """A DataFrame passed directly to a mark is discovered by variable name,
    referenced as a table, and carried in the spec's data section for the host
    (e.g. the widget) to register."""

    def test_frame_is_referenced_and_named_after_variable(self) -> None:
        pytest.importorskip("pyarrow")
        import pyarrow as pa

        weather = pa.table({"a": [1, 2, 3]})
        view = vg.plot(vg.dot(weather, x="a"))
        d = view.to_dict()

        assert d["plot"][0]["data"] == {"from": "weather"}
        assert d["data"]["weather"] is weather

    def test_frame_and_datadef_share_the_data_section(self) -> None:
        pytest.importorskip("pyarrow")
        import pyarrow as pa

        weather = pa.table({"a": [1]})
        athletes = vg.csv("athletes.csv")
        view = vg.plot(vg.dot(weather, x="a"), vg.dot(athletes, x="a"))
        d = view.to_dict()

        assert d["plot"][0]["data"] == {"from": "weather"}
        assert d["plot"][1]["data"] == {"from": "athletes"}
        assert d["data"]["weather"] is weather
        assert d["data"]["athletes"] == {"type": "csv", "file": "athletes.csv"}

    def test_frame_typing(self) -> None:
        pytest.importorskip("polars")
        pytest.importorskip("pandas")
        pytest.importorskip("duckdb")
        pytest.importorskip("pyarrow")
        import duckdb
        import pandas as pd
        import polars as pl
        import pyarrow as pa

        data = {"a": [1]}

        df_polars = pl.DataFrame(data)
        df_pandas = pd.DataFrame(data)
        df_duckdb = duckdb.from_arrow(df_polars)
        df_pyarrow = pa.table(data)

        mark_polars = vg.bar_x(df_polars)
        vg.line(df_polars)
        vg.circle(df_polars)
        vg.mark("rectX", df_polars)

        mark_pandas = vg.bar_x(df_pandas)
        vg.line(df_pandas)
        vg.circle(df_pandas)
        vg.mark("rectX", df_pandas)

        mark_duckdb = vg.bar_x(df_duckdb)
        vg.line(df_duckdb)
        vg.circle(df_duckdb)
        vg.mark("rectX", df_duckdb)

        mark_pyarrow = vg.bar_x(df_pyarrow)
        vg.line(df_pyarrow)
        vg.circle(df_pyarrow)
        vg.mark("rectX", df_pyarrow)

        if TYPE_CHECKING:
            from typing_extensions import assert_type
            from vgplot._types import MarkData

            assert_type(mark_polars.data, MarkData)
            assert_type(mark_pandas.data, MarkData)
            assert_type(mark_duckdb.data, MarkData)
            assert_type(mark_pyarrow.data, MarkData)


if TYPE_CHECKING:

    def typing_dunder_all() -> None:
        # Ok
        _ = vg.arrow
        _ = vg.errorbar_x
        _ = vg.mark

        # TODO @dangotbanned: Get pyright to error on these
        # Error (`_generated` modules)
        _ = vg.attributes  # ty: ignore[unresolved-attribute]
        _ = vg.marks  # ty: ignore[unresolved-attribute]
