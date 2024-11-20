from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


counties = DataSource(
    type="spatial",
    file="data/us-counties-10m.json",
    where=""
)
states = DataSource(
    type="spatial",
    file="data/us-counties-10m.json",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Geo(mark="geo", data=PlotFrom(from_="counties"), stroke=ChannelValueSpec(ChannelValue("currentColor")), strokeWidth=0.25)),
        PlotMark(Geo(mark="geo", data=PlotFrom(from_="states"), stroke=ChannelValueSpec(ChannelValue("currentColor")), strokeWidth=1)),
        PlotMark(Dot(mark="dot", data=PlotFrom(from_="counties"), x=ChannelValueSpec(ChannelValue({"centroidX":"geom"})), y=ChannelValueSpec(ChannelValue({"centroidY":"geom"})), fill=ChannelValueSpec(ChannelValue("transparent")), r=2, tip=None, title=ChannelValueSpec(ChannelValue("name"))))
    ],
    width=None,
    height=None,
    margin=0
)