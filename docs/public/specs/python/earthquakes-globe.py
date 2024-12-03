from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


earthquakes = DataSource(
    type="parquet",
    file="data/earthquakes.parquet",
    where=""
)
land = DataSource(
    type="spatial",
    file="data/countries-110m.json",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Geo(mark="geo", data=PlotFrom(from_="land"), fill=ChannelValueSpec(ChannelValue("currentColor")), fillOpacity=0.2)),
        PlotMark(Sphere(mark="sphere")),
        PlotMark(Dot(mark="dot", data=PlotFrom(from_="earthquakes"), x=ChannelValueSpec(ChannelValue("longitude")), y=ChannelValueSpec(ChannelValue("latitude")), fill=ChannelValueSpec(ChannelValue("red")), stroke=ChannelValueSpec(ChannelValue("red")), fillOpacity=0.2, r=ChannelValueSpec(ChannelValue(sql="POW(10, magnitude)"))))
    ],
    width=None,
    height=None,
    margin=10
)