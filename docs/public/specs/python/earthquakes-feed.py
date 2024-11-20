from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


feed = DataSource(
    type="spatial",
    file="data/usgs-feed.geojson",
    where=""
)
world = DataSource(
    type="spatial",
    file="data/countries-110m.json",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Geo(mark="geo", data=PlotFrom(from_="world"), fill=ChannelValueSpec(ChannelValue("currentColor")), fillOpacity=0.2)),
        PlotMark(Sphere(mark="sphere", strokeWidth=0.5)),
        PlotMark(Geo(mark="geo", data=PlotFrom(from_="feed"), fill=ChannelValueSpec(ChannelValue("red")), stroke=ChannelValueSpec(ChannelValue("red")), fillOpacity=0.2, r=ChannelValueSpec(ChannelValue(sql="POW(10, mag)")), title=ChannelValueSpec(ChannelValue("title"))))
    ],
    width=None,
    height=None,
    margin=2
)