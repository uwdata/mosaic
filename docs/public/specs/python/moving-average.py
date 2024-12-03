from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


cases = DataSource(
    type="parquet",
    file="data/berlin-covid.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(RectY(mark="rectY", data=PlotFrom(from_="cases"), y=ChannelValueSpec(ChannelValue("cases")), fill=ChannelValueSpec(ChannelValue("steelblue")))),
        PlotMark(LineY(mark="lineY", data=PlotFrom(from_="cases"), x=ChannelValueSpec(ChannelValue(sql="day + 0.5")), y=ChannelValueSpec(ChannelValue(avg="cases")), stroke=ChannelValueSpec(ChannelValue("currentColor"))))
    ],
    width=680,
    height=300
)