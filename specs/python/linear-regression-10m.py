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
        PlotMark(Raster(mark="raster", data=PlotFrom(from_="flights10m"), x=ChannelValueSpec(ChannelValue("time")), y=ChannelValueSpec(ChannelValue("delay")))),
        PlotMark(RegressionY(mark="regressionY", data=PlotFrom(from_="flights10m"), x=ChannelValueSpec(ChannelValue("time")), y=ChannelValueSpec(ChannelValue("delay")), stroke=ChannelValueSpec(ChannelValue("gray")))),
        PlotMark(RegressionY(mark="regressionY", data=PlotFrom(from_="flights10m", filterBy=$query), x=ChannelValueSpec(ChannelValue("time")), y=ChannelValueSpec(ChannelValue("delay")), stroke=ChannelValueSpec(ChannelValue("firebrick")))),
        PlotMark()
    ],
    width=None,
    height=None
)