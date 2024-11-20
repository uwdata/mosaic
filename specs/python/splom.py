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
        PlotMark(Frame(mark="frame", stroke=ChannelValueSpec(ChannelValue("#ccc")))),
        PlotMark(Dot(mark="dot", data=PlotFrom(from_="penguins"), x=ChannelValueSpec(ChannelValue("bill_length")), y=ChannelValueSpec(ChannelValue("body_mass")), fill=ChannelValueSpec(ChannelValue("species")), r=2)),
        PlotMark(),
        PlotMark()
    ],
    width=185,
    height=None
)