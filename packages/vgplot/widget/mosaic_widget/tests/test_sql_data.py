import duckdb
import pandas as pd
import pyarrow as pa
import pytest

from mosaic_widget import MosaicWidget
from mosaic_widget.spec_tables import (
    collect_table_filters,
    resolve_predicates,
)


@pytest.fixture
def weather_spec() -> dict:
    return {
        "data": {"weather": {"file": "weather.parquet"}},
        "params": {"click": {"select": "single"}},
        "vconcat": [
            {
                "hconcat": [
                    {
                        "plot": [
                            {
                                "mark": "dot",
                                "data": {"from": "weather", "filterBy": "$click"},
                            },
                        ],
                    },
                ],
            },
            {
                "plot": [
                    {"mark": "barX", "data": {"from": "weather"}},
                    {
                        "mark": "barX",
                        "data": {"from": "weather", "filterBy": "$range"},
                    },
                ],
            },
        ],
    }


@pytest.fixture
def weather_frame() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "x": [1, 2, 3, 4, 5],
            "weather": ["sun", "rain", "sun", "fog", "rain"],
        }
    )


def test_collect_table_filters_multi_table() -> None:
    spec = {
        "vconcat": [
            {"mark": "dot", "data": {"from": "a", "filterBy": "$s1"}},
            {"mark": "dot", "data": {"from": "b", "filterBy": "$s2"}},
        ],
    }
    assert collect_table_filters(spec) == {"a": ["s1"], "b": ["s2"]}


def test_collect_table_filters_no_filter() -> None:
    spec = {"mark": "dot", "data": {"from": "x"}}
    assert collect_table_filters(spec) == {"x": []}


def test_collect_table_filters_ignores_inline_data() -> None:
    spec = {"mark": "dot", "data": [{"x": 1}, {"x": 2}]}
    assert collect_table_filters(spec) == {}


def test_collect_table_filters_skips_dynamic_from() -> None:
    spec = {"mark": "dot", "data": {"from": "$tableParam"}}
    assert collect_table_filters(spec) == {}


def test_resolve_predicates_skips_missing_and_paramless() -> None:
    params = {
        "click": {"value": None, "predicate": "x = 1"},
        "range": {"value": 5},
    }
    assert resolve_predicates(params, ["click", "range", "other"]) == ["x = 1"]


def test_resolve_predicates_empty_predicate_skipped() -> None:
    params = {"click": {"value": None, "predicate": "   "}}
    assert resolve_predicates(params, ["click"]) == []


def test_sql_no_predicates(weather_spec: dict, weather_frame: pd.DataFrame) -> None:
    widget = MosaicWidget(spec=weather_spec, data={"weather": weather_frame})
    assert widget.sql == 'SELECT * FROM "weather"'


def test_sql_combines_predicates_with_and(
    weather_spec: dict, weather_frame: pd.DataFrame
) -> None:
    widget = MosaicWidget(spec=weather_spec, data={"weather": weather_frame})
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
        "range": {"value": [1, 3], "predicate": '"x" BETWEEN 1 AND 3'},
    }
    sql = widget.sql
    assert sql.startswith('SELECT * FROM "weather" WHERE ')
    assert "(\"weather\" = 'sun')" in sql
    assert '("x" BETWEEN 1 AND 3)' in sql
    assert " AND " in sql


def test_data_returns_duckdb_relation(
    weather_spec: dict, weather_frame: pd.DataFrame
) -> None:
    widget = MosaicWidget(spec=weather_spec, data={"weather": weather_frame})
    relation = widget.data()
    assert isinstance(relation, duckdb.DuckDBPyRelation)
    assert hasattr(relation, "df")
    assert hasattr(relation, "pl")
    assert hasattr(relation, "arrow")


def test_data_sql_matches_widget_sql(
    weather_spec: dict, weather_frame: pd.DataFrame
) -> None:
    widget = MosaicWidget(spec=weather_spec, data={"weather": weather_frame})
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
    }
    assert widget.data().df().equals(widget.con.query(widget.sql).df())


def test_data_returns_filtered_dataframe(
    weather_spec: dict, weather_frame: pd.DataFrame
) -> None:
    widget = MosaicWidget(spec=weather_spec, data={"weather": weather_frame})
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
    }
    result = widget.data().df()
    assert isinstance(result, pd.DataFrame)
    assert sorted(result["weather"].tolist()) == ["sun", "sun"]


def test_data_arrow(weather_spec: dict, weather_frame: pd.DataFrame) -> None:
    widget = MosaicWidget(spec=weather_spec, data={"weather": weather_frame})
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
    }
    table = widget.data().arrow().read_all()
    assert isinstance(table, pa.Table)
    assert table.num_rows == 2


def test_data_polars(weather_spec: dict, weather_frame: pd.DataFrame) -> None:
    pl = pytest.importorskip("polars")
    widget = MosaicWidget(spec=weather_spec, data={"weather": weather_frame})
    widget.params = {
        "range": {"value": [1, 3], "predicate": '"x" BETWEEN 1 AND 3'},
    }
    result = widget.data(filter_by="range").pl()
    assert isinstance(result, pl.DataFrame)
    assert sorted(result["x"].to_list()) == [1, 2, 3]


def test_data_fetchall(weather_spec: dict, weather_frame: pd.DataFrame) -> None:
    widget = MosaicWidget(spec=weather_spec, data={"weather": weather_frame})
    rows = widget.data().fetchall()
    assert len(rows) == 5
    assert all(isinstance(row, tuple) for row in rows)


def test_data_filter_by_subset(weather_spec: dict, weather_frame: pd.DataFrame) -> None:
    widget = MosaicWidget(spec=weather_spec, data={"weather": weather_frame})
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
        "range": {"value": [1, 3], "predicate": '"x" BETWEEN 1 AND 3'},
    }
    result = widget.data(filter_by="range").df()
    assert sorted(result["x"].tolist()) == [1, 2, 3]


def test_data_explicit_table(weather_spec: dict, weather_frame: pd.DataFrame) -> None:
    widget = MosaicWidget(spec=weather_spec, data={"weather": weather_frame})
    result = widget.data("weather").df()
    assert len(result) == 5


def test_sql_multi_table_errors() -> None:
    spec = {
        "vconcat": [
            {"mark": "dot", "data": {"from": "a"}},
            {"mark": "dot", "data": {"from": "b"}},
        ],
    }
    widget = MosaicWidget(
        spec=spec,
        data={
            "a": pd.DataFrame({"v": [1, 2]}),
            "b": pd.DataFrame({"v": [3, 4]}),
        },
    )
    with pytest.raises(ValueError, match="multiple source tables"):
        _ = widget.sql


def test_sql_no_tables_errors() -> None:
    widget = MosaicWidget(spec={})
    with pytest.raises(ValueError, match="No source tables"):
        _ = widget.sql


def test_data_unknown_table_errors(
    weather_spec: dict, weather_frame: pd.DataFrame
) -> None:
    widget = MosaicWidget(spec=weather_spec, data={"weather": weather_frame})
    with pytest.raises(ValueError, match="not found in spec"):
        widget.data("missing")

