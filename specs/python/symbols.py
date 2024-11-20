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
        PlotMark(Dot(mark="dot", data=PlotFrom(from_="penguins"), x=ChannelValueSpec(ChannelValue("body_mass")), y=ChannelValueSpec(ChannelValue("flipper_length")), stroke=ChannelValueSpec(ChannelValue("species"))))
    ],
    width=None,
    height=None
)