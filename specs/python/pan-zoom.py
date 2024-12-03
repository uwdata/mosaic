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
        PlotMark(Frame(mark="frame")),
        PlotMark(Dot(mark="dot", data=PlotFrom(from_="penguins"), x=ChannelValueSpec(ChannelValue("bill_length")), y=ChannelValueSpec(ChannelValue("bill_depth")), fill=ChannelValueSpec(ChannelValue("species")), r=2)),
        PlotMark()
    ],
    width=320,
    height=240
)