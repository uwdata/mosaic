import pytest
from schema_wrapper.utils import _todict
from schema_wrapper.generated_classes import *
import json
from unittest import TestCase

# Q to ask: how to import the dicts besides using os.path?

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
                                        data=PlotMarkData(PlotFrom(from_="ca55")),
                                        mark="raster",
                                        x=ChannelValueSpec(ChannelValue("LONGITUDE")),
                                        y=ChannelValueSpec(ChannelValue("LATITUDE")),
                                        fill=ChannelValueSpec({"max": "MAG_IGRF90"}),
                                        interpolate=ParamRef("$interp"),
                                        bandwidth=ParamRef("$blur")
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


if __name__ == "__main__":
    pytest.main([__file__])
