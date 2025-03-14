import pytest
from schema_wrapper.utils import _todict
from schema_wrapper.generated_classes import *
import json


def test_weather_plot():
    correct_dict = {
      "params": {
        "click": { "select": "single" },
        "domain": ["sun", "fog", "drizzle", "rain", "snow"],
        "colors": ["#e7ba52", "#a7a7a7", "#aec7e8", "#1f77b4", "#9467bd"]
      },
      "vconcat": [
        {
          "hconcat": [
            {
              "plot": [
                {
                  "mark": "dot",
                  "data": { "from": "weather", "filterBy": "$click" },
                  "x": { "dateMonthDay": "date" },
                  "y": "temp_max",
                  "fill": "weather",
                  "r": "precipitation",
                  "opacity": 0.7
                },
                { "select": "intervalX", "as": "$range" },
                { "select": "highlight", "by": "$range", "fill": "#eee" },
                { "legend": "color", "as": "$click", "columns": 1 }
              ],
              "xyDomain": "Fixed",
              "xTickFormat": "%b",
              "colorDomain": "$domain",
              "colorRange": "$colors",
              "rDomain": "Fixed",
              "rRange": [2, 10],
              "width": 800
            }
          ]
        },
        {
          "plot": [
            {
              "mark": "barX",
              "data": { "from": "weather" },
              "x": { "count": None },
              "y": "weather",
              "fill": "#f5f5f5"
            },
            {
              "mark": "barX",
              "data": { "from": "weather", "filterBy": "$range" },
              "x": { "count": None },
              "y": "weather",
              "fill": "weather",
              "order": "weather"
            },
            { "select": "toggleY", "as": "$click" },
            { "select": "highlight", "by": "$click" }
          ],
          "xDomain": "Fixed",
          "yDomain": "$domain",
          "yLabel": None,
          "colorDomain": "$domain",
          "colorRange": "$colors",
          "width": 800
        }
      ]
    }

    python_spec = Spec(
        {
            "params": Params(
                click=ParamDefinition(Selection("single")),
                domain=ParamDefinition(
                    ParamValue(
                        [
                            ParamLiteral("sun"),
                            ParamLiteral("fog"),
                            ParamLiteral("drizzle"),
                            ParamLiteral("rain"),
                            ParamLiteral("snow"),
                        ]
                    )
                ),
                colors=ParamDefinition(
                    ParamValue(
                        [
                            ParamLiteral("#e7ba52"),
                            ParamLiteral("#a7a7a7"),
                            ParamLiteral("#aec7e8"),
                            ParamLiteral("#1f77b4"),
                            ParamLiteral("#9467bd"),
                        ]
                    )
                ),
            ),
            "vconcat": VConcat(
                [
                    Component(
                        HConcat(
                            [
                                Component(
                                    Plot(
                                        plot=[
                                            PlotMark(
                                                Dot(
                                                    PlotMarkData(
                                                        PlotFrom(
                                                            ParamRef("$click"),
                                                            from_="weather",
                                                        )
                                                    ),
                                                    mark="dot",
                                                    x=ChannelValueSpec(
                                                        {"dateMonthDay": "date"}
                                                    ),
                                                    y=ChannelValueSpec(
                                                        ChannelValue("temp_max")
                                                    ),
                                                    fill=ChannelValueSpec(
                                                        ChannelValue("weather")
                                                    ),
                                                    r=ChannelValueSpec(
                                                        ChannelValue("precipitation")
                                                    ),
                                                    opacity=ChannelValueSpec(
                                                        ChannelValue(0.7)
                                                    ),
                                                ),
                                            ),
                                            PlotInteractor(
                                                IntervalX(
                                                    select="intervalX",
                                                    as_=ParamRef("$range"),
                                                )
                                            ),
                                            PlotInteractor(
                                                Highlight(
                                                    select="highlight",
                                                    by="$range",
                                                    fill="#eee",
                                                )
                                            ),
                                            PlotLegend(
                                                legend="color", as_="$click", columns=1
                                            ),
                                        ],
                                        xyDomain=Fixed("Fixed"),
                                        xTickFormat="%b",
                                        colorDomain="$domain",
                                        colorRange="$colors",
                                        rDomain=Fixed("Fixed"),
                                        rRange=[2, 10],
                                        width=800,
                                    )
                                )
                            ]
                        )
                    ),
                    Component(
                        Plot(
                            plot=[
                                PlotMark(
                                    BarX(
                                        data=PlotMarkData(PlotFrom(from_="weather")),
                                        mark="barX",
                                        x=ChannelValueSpec({"count": None}),
                                        y=ChannelValueSpec(ChannelValue("weather")),
                                        fill=ChannelValueSpec(ChannelValue("#f5f5f5")),
                                    )
                                ),
                                PlotMark(
                                    BarX(
                                        data=PlotMarkData(
                                            PlotFrom(from_="weather", filterBy="$range")
                                        ),
                                        mark="barX",
                                        x=ChannelValueSpec({"count": None}),
                                        y="weather",
                                        fill="weather",
                                        order="weather",
                                    )
                                ),
                                PlotInteractor(
                                    IntervalX(select="toggleY", as_=ParamRef("$click"))
                                ),
                                PlotInteractor(
                                    Highlight(by=ParamRef("$click"), select="highlight")
                                ),
                            ],
                            xDomain=Fixed("Fixed"),
                            yDomain=ParamRef("$domain"),
                            yLabel=None,
                            colorDomain=ParamRef("$domain"),
                            colorRange=ParamRef("$colors"),
                            width=800,
                        )
                    ),
                ]
            ),
        }
    )

    generated_dict = _todict(python_spec, True)
    print(f"generated_dict: {json.dumps(generated_dict, sort_keys=True)}\n\n\nreference_dict: {json.dumps(correct_dict, sort_keys=True)}")
    assert json.dumps(correct_dict, sort_keys=True) == json.dumps(generated_dict, sort_keys=True)


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
    pytest.main([__file__])
