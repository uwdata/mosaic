import duckdb
import pandas as pd
import pyarrow as pa
import pytest

from mosaic_widget import MosaicWidget


@pytest.fixture
def weather_spec() -> dict:
    return {
        "params": {"click": {"select": "single"}},
        "vconcat": [
            {
                "plot": [
                    {
                        "mark": "dot",
                        "data": {"from": "weather", "filterBy": "$click"},
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


@pytest.fixture
def widget(weather_spec: dict, weather_frame: pd.DataFrame) -> MosaicWidget:
    return MosaicWidget(spec=weather_spec, data={"weather": weather_frame})


def test_sql_no_predicates(widget: MosaicWidget) -> None:
    assert widget.sql == 'SELECT * FROM "weather"'


def test_sql_combines_predicates_with_and(widget: MosaicWidget) -> None:
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
        "range": {"value": [1, 3], "predicate": '"x" BETWEEN 1 AND 3'},
    }
    sql = widget.sql
    assert sql.startswith('SELECT * FROM "weather" WHERE ')
    assert "(\"weather\" = 'sun')" in sql
    assert '("x" BETWEEN 1 AND 3)' in sql
    assert " AND " in sql


def test_sql_skips_empty_predicates_and_plain_params(widget: MosaicWidget) -> None:
    widget.params = {
        "click": {"value": None, "predicate": ""},
        "brush": {"value": None, "predicate": "   "},
        "query": {"value": "sun"},
        "range": {"value": [1, 3], "predicate": '"x" BETWEEN 1 AND 3'},
    }
    assert widget.sql == 'SELECT * FROM "weather" WHERE ("x" BETWEEN 1 AND 3)'


def test_sql_infers_table_from_spec_data(weather_frame: pd.DataFrame) -> None:
    con = duckdb.connect()
    con.register("weather", weather_frame)
    spec = {
        "data": {"weather": {"file": "weather.parquet"}},
        "plot": [{"mark": "dot", "data": {"from": "weather"}}],
    }
    widget = MosaicWidget(spec=spec, con=con)
    assert widget.sql == 'SELECT * FROM "weather"'


def test_sql_none_when_no_tables() -> None:
    widget = MosaicWidget(spec={})
    with pytest.warns(UserWarning, match="No source tables"):
        assert widget.sql is None


def test_sql_none_when_multiple_tables() -> None:
    widget = MosaicWidget(
        data={
            "a": pd.DataFrame({"v": [1, 2]}),
            "b": pd.DataFrame({"v": [3, 4]}),
        },
    )
    with pytest.warns(UserWarning, match="Multiple source tables"):
        assert widget.sql is None


def test_data_returns_duckdb_relation(widget: MosaicWidget) -> None:
    relation = widget.data()
    assert isinstance(relation, duckdb.DuckDBPyRelation)


def test_data_sql_matches_widget_sql(widget: MosaicWidget) -> None:
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
    }
    assert widget.data().df().equals(widget.con.query(widget.sql).df())


def test_data_returns_filtered_dataframe(widget: MosaicWidget) -> None:
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
    }
    result = widget.data().df()
    assert isinstance(result, pd.DataFrame)
    assert sorted(result["weather"].tolist()) == ["sun", "sun"]


def test_data_arrow(widget: MosaicWidget) -> None:
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
    }
    table = widget.data().arrow().read_all()
    assert isinstance(table, pa.Table)
    assert table.num_rows == 2


def test_data_polars(widget: MosaicWidget) -> None:
    pl = pytest.importorskip("polars")
    widget.params = {
        "range": {"value": [1, 3], "predicate": '"x" BETWEEN 1 AND 3'},
    }
    result = widget.data(filter_by="range").pl()
    assert isinstance(result, pl.DataFrame)
    assert sorted(result["x"].to_list()) == [1, 2, 3]


def test_data_fetchall(widget: MosaicWidget) -> None:
    rows = widget.data().fetchall()
    assert len(rows) == 5
    assert all(isinstance(row, tuple) for row in rows)


def test_data_filter_by_subset(widget: MosaicWidget) -> None:
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
        "range": {"value": [1, 3], "predicate": '"x" BETWEEN 1 AND 3'},
    }
    result = widget.data(filter_by="range").df()
    assert sorted(result["x"].tolist()) == [1, 2, 3]


def test_data_filter_by_accepts_dollar_prefix(widget: MosaicWidget) -> None:
    widget.params = {
        "click": {"value": "sun", "predicate": "\"weather\" = 'sun'"},
        "range": {"value": [1, 3], "predicate": '"x" BETWEEN 1 AND 3'},
    }
    result = widget.data(filter_by=["$range"]).df()
    assert sorted(result["x"].tolist()) == [1, 2, 3]


def test_data_filter_by_unknown_errors(widget: MosaicWidget) -> None:
    with pytest.raises(ValueError, match="Unknown selection"):
        widget.data(filter_by="missing")


def test_data_explicit_table(widget: MosaicWidget) -> None:
    result = widget.data("weather").df()
    assert len(result) == 5


def test_data_explicit_table_not_registered() -> None:
    con = duckdb.connect()
    con.execute("CREATE TABLE extras AS SELECT * FROM (VALUES (1), (2)) t(v)")
    widget = MosaicWidget(con=con)
    assert len(widget.data("extras").df()) == 2


def test_data_multiple_tables_requires_table_argument() -> None:
    widget = MosaicWidget(
        data={
            "a": pd.DataFrame({"v": [1, 2]}),
            "b": pd.DataFrame({"v": [3, 4]}),
        },
    )
    with pytest.raises(ValueError, match="Multiple source tables"):
        widget.data()
    assert widget.data("b").df()["v"].tolist() == [3, 4]


def test_data_no_tables_requires_table_argument() -> None:
    widget = MosaicWidget(spec={})
    with pytest.raises(ValueError, match="No source tables"):
        widget.data()
