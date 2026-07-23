from __future__ import annotations

from typing import TYPE_CHECKING

import duckdb
import pytest

from mosaic_widget import MosaicWidget

if TYPE_CHECKING:
    import pandas as pd


@pytest.fixture
def weather_frame(pd_dataframe: type[pd.DataFrame]) -> pd.DataFrame:
    return pd_dataframe(
        {
            "x": [1, 2, 3, 4, 5],
            "weather": ["sun", "rain", "sun", "fog", "rain"],
        }
    )


@pytest.fixture
def widget(weather_frame: pd.DataFrame) -> MosaicWidget:
    return MosaicWidget(data={"weather": weather_frame})


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


def test_sql_infers_table_from_spec_data(weather_frame: pd.DataFrame) -> None:
    con = duckdb.connect()
    con.register("weather", weather_frame)
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
    assert sorted(relation.df()["weather"].tolist()) == ["sun", "sun"]


def test_data_filter_by_subset_and_dollar_prefix(widget: MosaicWidget) -> None:
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
        "range": {"value": [1, 3], "predicate": '"x" BETWEEN 1 AND 3'},
    }
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
    pd_dataframe: type[pd.DataFrame],
) -> None:
    widget = MosaicWidget(
        data={
            "a": pd_dataframe({"v": [1, 2]}),
            "b": pd_dataframe({"v": [3, 4]}),
        },
    )
    with pytest.raises(ValueError, match="Multiple source tables"):
        widget.data()
    assert widget.data("b").df()["v"].tolist() == [3, 4]
