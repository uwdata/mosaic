"""
pytest packages/schema_wrapper/test/test.py
"""

import unittest
from pathlib import Path
import pytest

from packages.schema_wrapper.generated_classes import (
    AggregateExpression,
    AggregateTransform,
    ChannelValue,
    PlotMarkData,
    ChannelValueSpec,
    Argmin,
    Argmax,
    Avg,
    CSSStyles,
    Plot,
    BrushStyles,
    DataCSV,
    DataQuery,
    DataSpatial,
    DataTable
)

@pytest.fixture
def sample_data():
    return {
        "csv_data": {
            "file": "data.csv",
            "type": "csv",
            "delimiter": ",",
            "temp": True
        },
        "spatial_data": {
            "file": "map.geojson",
            "type": "geojson",
            "layer": "features"
        },
        "table_data": {
            "query": "SELECT * FROM table",
            "type": "table"
        }
    }

def test_aggregate_expression():
    agg_expr = AggregateExpression("sum", "total")
    assert agg_expr.agg == "sum"
    assert agg_expr.label == "total"

def test_aggregate_transform():
    # Test with string value
    avg = Avg(avg="value")
    agg_transform = AggregateTransform(avg)
    assert isinstance(agg_transform.value, Avg)
    assert agg_transform.value.avg == "value"

    # Test with numeric value
    agg_transform = AggregateTransform(Avg(avg=2))
    assert agg_transform.value.avg == 2

    # Test with boolean value
    agg_transform = AggregateTransform(Avg(avg=True))
    assert agg_transform.value.avg == True

def test_data_classes(sample_data):
    # Test CSV data
    csv_data = DataCSV(**sample_data["csv_data"])
    assert csv_data.file == "data.csv"
    assert csv_data.type == "csv"
    assert csv_data.delimiter == ","
    assert csv_data.temp == True

    # Test Spatial data
    spatial_data = DataSpatial(**sample_data["spatial_data"])
    assert spatial_data.file == "map.geojson"
    assert spatial_data.type == "geojson"
    assert spatial_data.layer == "features"

    # Test Table data
    table_data = DataTable(**sample_data["table_data"])
    assert table_data.query == "SELECT * FROM table"
    assert table_data.type == "table"

def test_plot_components():
    # Test Plot class
    plot = Plot(
        "scatter",
        width=500,
        height=300,
        xLabel="X Axis",
        yLabel="Y Axis"
    )
    assert plot.plot == "scatter"
    assert plot.width == 500
    assert plot.height == 300
    assert plot.xLabel == "X Axis"
    assert plot.yLabel == "Y Axis"

    # Test BrushStyles
    styles = BrushStyles(
        fill="red",
        fillOpacity=0.5,
        opacity=0.7,
        stroke="black",
        strokeOpacity=0.3
    )
    assert styles.fill == "red"
    assert styles.fillOpacity == 0.5
    assert styles.opacity == 0.7
    assert styles.stroke == "black"
    assert styles.strokeOpacity == 0.3

def test_argmin_argmax():
    # Test Argmin
    argmin = Argmin([1.0, 2.0], distinct=True, orderby="date")
    assert argmin.argmin == [1.0, 2.0]
    assert argmin.distinct == True
    assert argmin.orderby == "date"
    assert isinstance(argmin.argmin, list)
    assert all(isinstance(item, (float, bool, str)) for item in argmin.argmin)

    # Test Argmax
    argmax = Argmax("value", distinct=True, orderby="date")
    assert argmax.argmax == "value"
    assert argmax.distinct == True
    assert argmax.orderby == "date"

if __name__ == '__main__':
    pytest.main([__file__])