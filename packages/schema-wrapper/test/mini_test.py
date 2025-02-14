from schema_wrapper.utils import _todict

from schema_wrapper.generated_classes import *


def test_weather_plot():
    plot_spec = Plot(
        plot=[
            PlotMark(
                Dot(
                    mark="dot",
                    data=PlotFrom(from_="weather", filterBy="$click"),
                    x=ChannelValueSpec(ChannelValue({"dateMonthDay": "date"})),
                    y=ChannelValueSpec(ChannelValue("temp_max")),
                    fill="weather",
                    r="precipitation",
                )
            )
        ],
        xyDomain="Fixed",
        xTickFormat="%b",
        colorDomain="$domain",
        colorRange="$colors",
        rDomain="Fixed",
        rRange=[2, 10],
        width=800,
    )
    print(_todict(plot_spec))


def test_stock_plot():
    plot_spec = Plot(
        plot=[
            PlotMark(
                LineY(
                    mark="lineY",
                    data=PlotFrom(from_="aapl"),
                    x=ChannelValueSpec(ChannelValue("Date")),
                    y=ChannelValueSpec(ChannelValue("Close")),
                )
            )
        ],
        width=680,
        height=200,
    )
    print(_todict(plot_spec))


if __name__ == "__main__":
    test_weather_plot()
    test_stock_plot()
