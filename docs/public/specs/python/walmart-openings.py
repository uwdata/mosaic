from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


states = DataSource(
    type="spatial",
    file="data/us-counties-10m.json",
    where=""
)
nation = DataSource(
    type="spatial",
    file="data/us-counties-10m.json",
    where=""
)
walmarts = DataSource(
    type="parquet",
    file="data/walmarts.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Geo(mark="geo", data=PlotFrom(from_="states"), stroke=ChannelValueSpec(ChannelValue("#aaa")), strokeWidth=1)),
        PlotMark(Geo(mark="geo", data=PlotFrom(from_="nation"), stroke=ChannelValueSpec(ChannelValue("currentColor")))),
        PlotMark(Dot(mark="dot", data=PlotFrom(from_="walmarts"), x=ChannelValueSpec(ChannelValue("longitude")), y=ChannelValueSpec(ChannelValue("latitude")), fill=ChannelValueSpec(ChannelValue("blue")), r=1.5)),
        PlotMark(AxisFy(mark="axisFy", frameAnchor="top", dy=30, tickFormat="d"))
    ],
    width=None,
    height=None,
    margin=0
)