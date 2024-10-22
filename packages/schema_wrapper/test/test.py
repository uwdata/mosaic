"""
python -m unittest packages.schema_wrapper.test.test
"""

import unittest
from packages.schema_wrapper.generated_classes import (
    AggregateExpression,
    AggregateTransform,
    ChannelValue,
    PlotMarkData,
    ChannelValueSpec,
    Argmax,
    Avg,
    CSSStyles,
    Plot
)

class TestGeneratedClasses(unittest.TestCase):

    def test_aggregate_expression(self):
        agg_expr = AggregateExpression("sum", "total")
        self.assertEqual(agg_expr.agg, "sum")
        self.assertEqual(agg_expr.label, "total")

    def test_aggregate_transform(self):
        avg = Avg(avg="value")
        agg_transform = AggregateTransform(avg)
        self.assertIsInstance(agg_transform.value, Avg)
        self.assertEqual(agg_transform.value.avg, "value")

    def test_channel_value(self):
        channel_value = ChannelValue("x")
        self.assertEqual(channel_value.value, "x")

    def test_plot_mark_data(self):
        plot_mark_data = PlotMarkData({"type": "csv", "url": "data.csv"})
        self.assertIsInstance(plot_mark_data.value, dict)
        self.assertEqual(plot_mark_data.value["type"], "csv")

    def test_channel_value_spec(self):
        channel_value_spec = ChannelValueSpec("y")
        self.assertEqual(channel_value_spec.value, "y")

    def test_argmax(self):
        argmax = Argmax("value", distinct=True, orderby="date")
        self.assertEqual(argmax.argmax, "value")
        self.assertEqual(argmax.distinct, True)
        self.assertEqual(argmax.orderby, "date")

    def test_css_styles(self):
        styles = CSSStyles(color="red", fontSize="14px")
        self.assertEqual(styles.color, "red")
        self.assertEqual(styles.fontSize, "14px")

    def test_plot(self):
        plot = Plot(
            "scatter",
            width=500,
            height=300,
            xLabel="X Axis",
            yLabel="Y Axis"
        )
        self.assertEqual(plot.plot, "scatter")
        self.assertEqual(plot.width, 500)
        self.assertEqual(plot.height, 300)
        self.assertEqual(plot.xLabel, "X Axis")
        self.assertEqual(plot.yLabel, "Y Axis")

if __name__ == '__main__':
    unittest.main()