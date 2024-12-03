from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


flights = DataSource(
    type="parquet",
    file="data/flights-200k.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(RectY(mark="rectY", data=PlotFrom(from_="flights"), x=ChannelValueSpec(ChannelValue({"bin":"time"})), y=ChannelValueSpec(ChannelValue(count="")), fill=ChannelValueSpec(ChannelValue("steelblue")))),
        PlotMark()
    ],
    width=605,
    height=70
)