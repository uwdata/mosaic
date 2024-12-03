from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


penguins = DataSource(
    type="parquet",
    file="data/penguins.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Density(mark="density", data=PlotFrom(from_="penguins"), x=ChannelValueSpec(ChannelValue("bill_length")), y=ChannelValueSpec(ChannelValue("bill_depth")), fill=ChannelValueSpec(ChannelValue("species")), fillOpacity=0.5, r=ChannelValueSpec(ChannelValue("density")))),
        PlotMark(Dot(mark="dot", data=PlotFrom(from_="penguins"), x=ChannelValueSpec(ChannelValue("bill_length")), y=ChannelValueSpec(ChannelValue("bill_depth")), fill=ChannelValueSpec(ChannelValue("currentColor")), r=1))
    ],
    width=700,
    height=480
)