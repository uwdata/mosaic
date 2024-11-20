from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


flights10m = DataSource(
    type="table",
    file="undefined",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(RectY(mark="rectY", data=PlotFrom(from_="flights10m", filterBy=$brush), x=ChannelValueSpec(ChannelValue({"bin":"delay"})), y=ChannelValueSpec(ChannelValue(count="")), fill=ChannelValueSpec(ChannelValue("steelblue")))),
        PlotMark()
    ],
    width=600,
    height=200
)