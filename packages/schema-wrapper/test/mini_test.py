import pytest
from schema_wrapper.utils import _todict
from schema_wrapper.generated_classes import *
import json
from unittest import TestCase

# Q to ask: how to import the dicts besides using os.path? -------------- use pathlib Path

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
    TestCase().assertDictEqual(generated_dict, correct_dict)


def test_aeromagnetic_survey_plot():
    correct_dict = {
      "meta": {
        "title": "Aeromagnetic Survey",
        "description": "A raster visualization of the 1955 [Great Britain aeromagnetic survey](https://www.bgs.ac.uk/datasets/gb-aeromagnetic-survey/), which measured the Earth’s magnetic field by plane. Each sample recorded the longitude and latitude alongside the strength of the [IGRF](https://www.ncei.noaa.gov/products/international-geomagnetic-reference-field) in [nanoteslas](https://en.wikipedia.org/wiki/Tesla_(unit)). This example demonstrates both raster interpolation and smoothing (blur) options.\n",
        "credit": "Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-igfr90-raster)."
      },
      "data": {
        "ca55": {
          "type": "parquet",
          "file": "data/ca55-south.parquet"
        }
      },
      "params": {
        "interp": "random-walk",
        "blur": 0
      },
      "vconcat": [
        {
          "hconcat": [
            {
              "input": "menu",
              "label": "Interpolation Method",
              "options": [
                "none",
                "nearest",
                "barycentric",
                "random-walk"
              ],
              "as": "$interp"
            },
            {
              "hspace": "1em"
            },
            {
              "input": "slider",
              "label": "Blur",
              "min": 0,
              "max": 100,
              "as": "$blur"
            }
          ]
        },
        {
          "vspace": "1em"
        },
        {
          "plot": [
            {
              "mark": "raster",
              "data": {
                "from": "ca55"
              },
              "x": "LONGITUDE",
              "y": "LATITUDE",
              "fill": {
                "max": "MAG_IGRF90"
              },
              "interpolate": "$interp",
              "bandwidth": "$blur"
            }
          ],
          "colorScale": "diverging",
          "colorDomain": "Fixed"
        }
      ]
    }

    python_spec = Spec(
        {
            "meta": Meta(
                title="Aeromagnetic Survey",
                description="A raster visualization of the 1955 [Great Britain aeromagnetic survey](https://www.bgs.ac.uk/datasets/gb-aeromagnetic-survey/), which measured the Earth’s magnetic field by plane. Each sample recorded the longitude and latitude alongside the strength of the [IGRF](https://www.ncei.noaa.gov/products/international-geomagnetic-reference-field) in [nanoteslas](https://en.wikipedia.org/wiki/Tesla_(unit)). This example demonstrates both raster interpolation and smoothing (blur) options.\n",
                credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-igfr90-raster)."
            ),
            "data": Data(
                ca55=DataDefinition(
                    DataParquet(
                        type="parquet",
                        file="data/ca55-south.parquet"
                    )
                )
            ),
            "params": Params(
                interp=ParamDefinition(ParamLiteral("random-walk")),
                blur=ParamDefinition(ParamLiteral(0))
            ),
            "vconcat": VConcat(
                [
                    Component(
                        HConcat(
                            [
                                Component(
                                    Menu(
                                        input="menu",
                                        label="Interpolation Method",
                                        options=[
                                            "none",
                                            "nearest",
                                            "barycentric",
                                            "random-walk"
                                        ],
                                        as_="$interp"
                                    )
                                ),
                                Component(
                                    HSpace(
                                        hspace="1em"
                                    )
                                ),
                                Component(
                                    Slider(
                                        input="slider",
                                        label="Blur",
                                        min=0,
                                        max=100,
                                        as_="$blur"
                                    )
                                )
                            ]
                        )
                    ),
                    Component(
                        VSpace(
                            vspace="1em"
                        )
                    ),
                    Component(
                        Plot(
                            plot=[
                                PlotMark(
                                    Raster( 
                                        data={"from":"ca55"},
                                        mark="raster",
                                        x="LONGITUDE",
                                        y="LATITUDE",
                                        fill={"max": "MAG_IGRF90"},
                                        interpolate="$interp",
                                        bandwidth="$blur"
                                    )
                                )
                            ],
                            colorScale=ColorScaleType("diverging"),
                            colorDomain=Fixed("Fixed")
                        ),
                    )
                ]
            ),
        }
    )

    generated_dict = _todict(python_spec, True)
    TestCase().assertDictEqual(generated_dict, correct_dict)


def test_airline_travelers():
    correct_dict = {
      "meta": {
        "title": "Airline Travelers",
        "description": "A labeled line chart comparing airport travelers in 2019 and 2020.",
        "credit": "Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-labeled-line-chart)."
      },
      "data": {
        "travelers": {
          "type": "parquet",
          "file": "data/travelers.parquet"
        },
        "endpoint": {
          "type": "table",
          "query": "SELECT * FROM travelers ORDER BY date DESC LIMIT 1"
        }
      },
      "plot": [
        {
          "mark": "ruleY",
          "data": [
            0
          ]
        },
        {
          "mark": "lineY",
          "data": {
            "from": "travelers"
          },
          "x": "date",
          "y": "previous",
          "strokeOpacity": 0.35
        },
        {
          "mark": "lineY",
          "data": {
            "from": "travelers"
          },
          "x": "date",
          "y": "current"
        },
        {
          "mark": "text",
          "data": {
            "from": "endpoint"
          },
          "x": "date",
          "y": "previous",
          "text": [
            "2019"
          ],
          "fillOpacity": 0.5,
          "lineAnchor": "bottom",
          "dy": -6
        },
        {
          "mark": "text",
          "data": {
            "from": "endpoint"
          },
          "x": "date",
          "y": "current",
          "text": [
            "2020"
          ],
          "lineAnchor": "top",
          "dy": 6
        }
      ],
      "yGrid": True,
      "yLabel": "↑ Travelers per day",
      "yTickFormat": "s"
    }

    python_spec = Spec(
        {
            "meta": Meta(
                title="Airline Travelers",
                description="A labeled line chart comparing airport travelers in 2019 and 2020.",
                credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-labeled-line-chart)."
            ),
            "data": Data(
                travelers=DataDefinition(
                    DataParquet(
                        type="parquet",
                        file="data/travelers.parquet"
                    )
                ),
                endpoint=DataDefinition(
                    DataTable(
                        type="table",
                        query="SELECT * FROM travelers ORDER BY date DESC LIMIT 1"
                    )
                )
            ),
            "plot": [
              Component(
                PlotMark(
                    RuleY(
                        data=[0],
                        mark="ruleY"
                    )
                ),
              ),
              Component(
                PlotMark(
                    LineY(
                        data={"from":"travelers"},
                        mark="lineY",
                        x="date",
                        y="previous",
                        strokeOpacity=0.35
                    )
                ),
              ),
              Component(
                PlotMark(
                    LineY(
                        data={"from":"travelers"},
                        mark="lineY",
                        x="date",
                        y="current"
                    )
                ),
              ),
              Component(
                PlotMark(
                    Text(
                        data={"from":"endpoint"},
                        mark="text",
                        x="date",
                        y="previous",
                        text=["2019"],
                        fillOpacity=0.5,
                        lineAnchor="bottom",
                        dy=-6
                    )
                ),
              ),
              Component(
                PlotMark(
                    Text(
                        data={"from":"endpoint"},
                        mark="text",
                        x="date",
                        y="current",
                        text=["2020"],
                        lineAnchor="top",
                        dy=6
                    )
                )
              )
            ],
          
            "yGrid": True,
            "yLabel": "↑ Travelers per day",
            "yTickFormat": "s"
        }
    )

    generated_dict = _todict(python_spec, True)
    TestCase().assertDictEqual(generated_dict, correct_dict)

def test_athlete_birth_waffle_spec():
    correct_dict = {
      "meta": {
        "title": "Athlete Birth Waffle",
        "description": "Waffle chart counting Olympic athletes based on which half-decade they were born. The inputs enable adjustment of waffle mark design options.\n",
        "credit": "Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-waffle-unit)."
      },
      "data": {
        "athletes": {
          "type": "parquet",
          "file": "data/athletes.parquet"
        }
      },
      "params": {
        "unit": 10,
        "round": False,
        "gap": 1,
        "radius": 0
      },
      "vconcat": [
        {
          "hconcat": [
            {
              "input": "menu",
              "as": "$unit",
              "options": [
                1,
                2,
                5,
                10,
                25,
                50,
                100
              ],
              "label": "Unit"
            },
            {
              "input": "menu",
              "as": "$round",
              "options": [
                True,
                False
              ],
              "label": "Round"
            },
            {
              "input": "menu",
              "as": "$gap",
              "options": [
                0,
                1,
                2,
                3,
                4,
                5
              ],
              "label": "Gap"
            },
            {
              "input": "slider",
              "as": "$radius",
              "min": 0,
              "max": 10,
              "step": 0.1,
              "label": "Radius"
            }
          ]
        },
        {
          "vspace": 10
        },
        {
          "plot": [
            {
              "mark": "waffleY",
              "data": {
                "from": "athletes"
              },
              "unit": "$unit",
              "round": "$round",
              "gap": "$gap",
              "rx": "$radius",
              "x": {
                "sql": "5 * floor(year(\"date_of_birth\") / 5)"
              },
              "y": {
                "count": ""
              }
            }
          ],
          "xLabel": None,
          "xTickSize": 0,
          "xTickFormat": "d"
        }
      ]
    }
    python_spec = Spec(
        {
            "meta": Meta(
                title="Athlete Birth Waffle",
                description="Waffle chart counting Olympic athletes based on which half-decade they were born. The inputs enable adjustment of waffle mark design options.\n",
                credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-waffle-unit)."
            ),
            "data": Data(
                athletes=DataDefinition(
                    DataParquet(
                        type="parquet",
                        file="data/athletes.parquet"
                    )
                )
            ),
            "params": Params(
                unit=ParamDefinition(ParamLiteral(10)),
                round=ParamDefinition(ParamLiteral(False)),
                gap=ParamDefinition(ParamLiteral(1)),
                radius=ParamDefinition(ParamLiteral(0))
            ),
            "vconcat": VConcat(
                [
                    Component(
                        HConcat(
                            [
                                Component(
                                    Menu(
                                        input="menu",
                                        as_="$unit",
                                        options=[1, 2, 5, 10, 25, 50, 100],
                                        label="Unit"
                                    )
                                ),
                                Component(
                                    Menu(
                                        input="menu",
                                        as_="$round",
                                        options=[True, False],
                                        label="Round"
                                    )
                                ),
                                Component(
                                    Menu(
                                        input="menu",
                                        as_="$gap",
                                        options=[0, 1, 2, 3, 4, 5],
                                        label="Gap"
                                    )
                                ),
                                Component(
                                    Slider(
                                        input="slider",
                                        as_="$radius",
                                        min=0,
                                        max=10,
                                        step=0.1,
                                        label="Radius"
                                    )
                                )
                            ]
                        )
                    ),
                    Component(
                        VSpace(
                            vspace=10
                        )
                    ),
                    Component(
                        Plot(
                            plot=[
                                PlotMark(
                                    Rect(
                                        data=PlotMarkData(PlotFrom(from_="athletes")),
                                        mark="waffleY",
                                        unit=ParamRef("$unit"),
                                        round=ParamRef("$round"),
                                        gap=ParamRef("$gap"),
                                        rx=ParamRef("$radius"),
                                        x=ChannelValueSpec({"sql": "5 * floor(year(\"date_of_birth\") / 5)"}),
                                        y=ChannelValueSpec({"count": ""})
                                    )
                                )
                            ],
                            xLabel=None,
                            xTickSize=0,
                            xTickFormat="d"
                        )
                    )
                ]
            )
        }
    )
    
    generated_dict = _todict(python_spec, True)
    TestCase().assertDictEqual(generated_dict, correct_dict)


if __name__ == "__main__":
    pytest.main([__file__])
