from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


driving = DataSource(
    type="parquet",
    file="data/driving.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Line(mark="line", data=PlotFrom(from_="driving"), x=ChannelValueSpec(ChannelValue("miles")), y=ChannelValueSpec(ChannelValue("gas")))),
        PlotMark(Text(mark="text", data=PlotFrom(from_="driving"), x=ChannelValueSpec(ChannelValue("miles")), y=ChannelValueSpec(ChannelValue("gas")), dy=-6))
    ],
    width=None,
    height=None
)