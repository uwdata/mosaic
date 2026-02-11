from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


metros = DataSource(
    type="parquet",
    file="data/metros.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Arrow(mark="arrow", data=PlotFrom(from_="metros"), stroke=ChannelValueSpec(ChannelValue(sql="R90_10_2015 - R90_10_1980")))),
        PlotMark(Text(mark="text", data=PlotFrom(from_="metros"), x=ChannelValueSpec(ChannelValue("POP_2015")), y=ChannelValueSpec(ChannelValue("R90_10_2015")), fill=ChannelValueSpec(ChannelValue("currentColor")), dy=-6))
    ],
    width=None,
    height=None
)