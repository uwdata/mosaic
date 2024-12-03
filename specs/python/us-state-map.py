from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


states = DataSource(
    type="spatial",
    file="data/us-counties-10m.json",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Geo(mark="geo", data=PlotFrom(from_="states"), stroke=ChannelValueSpec(ChannelValue("currentColor")), strokeWidth=1)),
        PlotMark(Dot(mark="dot", data=PlotFrom(from_="states"), x=ChannelValueSpec(ChannelValue({"centroidX":"geom"})), y=ChannelValueSpec(ChannelValue({"centroidY":"geom"})), fill=ChannelValueSpec(ChannelValue("steelblue")), r=2, tip=None, title=ChannelValueSpec(ChannelValue("name"))))
    ],
    width=None,
    height=None,
    margin=0
)