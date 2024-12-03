from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


latency = DataSource(
    type="parquet",
    file="https://idl.uw.edu/mosaic-datasets/data/observable-latency.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Frame(mark="frame", fill=ChannelValueSpec(ChannelValue("black")))),
        PlotMark(Raster(mark="raster", data=PlotFrom(from_="latency", filterBy=$filter), x=ChannelValueSpec(ChannelValue("time")), y=ChannelValueSpec(ChannelValue("latency")), fill=ChannelValueSpec(ChannelValue({"argmax":["route","count"]})), fillOpacity=ChannelValueSpec(ChannelValue({"sum":"count"})))),
        PlotMark()
    ],
    width=680,
    height=300
)