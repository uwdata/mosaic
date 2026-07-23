from __future__ import annotations

from typing import TYPE_CHECKING

import duckdb
import pytest

from mosaic_widget import MosaicWidget

if TYPE_CHECKING:
    from .conftest import Data, DataFrameConstructor, NwDataFrame


@pytest.fixture
def frame_data() -> Data:
    return {"x": [1, 2, 3, 4, 5], "weather": ["sun", "rain", "sun", "fog", "rain"]}


@pytest.fixture
def weather_frame(nw_dataframe: DataFrameConstructor, frame_data: Data) -> NwDataFrame:
    return nw_dataframe(frame_data)


@pytest.fixture
def widget(weather_frame: NwDataFrame) -> MosaicWidget:
    return MosaicWidget(data={"weather": weather_frame.to_native()})


def test_sql_no_predicates(widget: MosaicWidget) -> None:
    assert widget.sql == 'SELECT * FROM "weather"'


def test_sql_predicates_joined_and_skipped(widget: MosaicWidget) -> None:
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
        "brush": {"value": None, "predicate": "   "},
        "query": {"value": "sun"},
        "range": {"value": [1, 3], "predicate": '"x" BETWEEN 1 AND 3'},
    }
    assert widget.sql == (
        'SELECT * FROM "weather" WHERE ("weather" = \'sun\') AND ("x" BETWEEN 1 AND 3)'
    )


def test_sql_infers_table_from_spec_data(
    weather_frame: NwDataFrame, request: pytest.FixtureRequest
) -> None:
    con = duckdb.connect()
    request.applymarker(
        pytest.mark.xfail(
            weather_frame.implementation.is_modin(),
            raises=duckdb.InvalidInputException,
            reason=("`modin.pandas.DataFrame` cannot be registered"),
        )
    )
    con.register("weather", weather_frame.to_native())
    widget = MosaicWidget(
        spec={"data": {"weather": {"file": "weather.parquet"}}}, con=con
    )
    assert widget.sql == 'SELECT * FROM "weather"'


def test_sql_none_when_no_tables() -> None:
    widget = MosaicWidget(spec={})
    with pytest.warns(UserWarning, match="No source tables"):
        assert widget.sql is None


def test_data_returns_filtered_relation(widget: MosaicWidget) -> None:
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
    }
    relation = widget.data()
    assert isinstance(relation, duckdb.DuckDBPyRelation)

    pytest.importorskip("pandas")
    assert sorted(relation.df()["weather"].tolist()) == ["sun", "sun"]


def test_data_filter_by_subset_and_dollar_prefix(widget: MosaicWidget) -> None:
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
        "range": {"value": [1, 3], "predicate": '"x" BETWEEN 1 AND 3'},
    }

    pytest.importorskip("pandas")
    result = widget.data(filter_by="range").df()
    assert sorted(result["x"].tolist()) == [1, 2, 3]
    assert widget.data(filter_by=["$range"]).df().equals(result)


def test_data_filter_by_unknown_errors(widget: MosaicWidget) -> None:
    with pytest.raises(ValueError, match="Unknown selection"):
        widget.data(filter_by="missing")


def test_data_explicit_table_not_registered() -> None:
    pytest.importorskip("pandas")
    con = duckdb.connect()
    con.execute("CREATE TABLE extras AS SELECT * FROM (VALUES (1), (2)) t(v)")
    widget = MosaicWidget(con=con)
    assert len(widget.data("extras").df()) == 2


def test_data_multiple_tables_requires_table_argument(
    nw_dataframe: DataFrameConstructor,
) -> None:
    widget = MosaicWidget(
        data={
            "a": nw_dataframe({"v": [1, 2]}).to_native(),
            "b": nw_dataframe({"v": [3, 4]}).to_native(),
        },
    )
    with pytest.raises(ValueError, match="Multiple source tables"):
        widget.data()

    pytest.importorskip("pandas")
    assert widget.data("b").df()["v"].tolist() == [3, 4]
