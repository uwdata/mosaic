from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


gaia = DataSource(
    type="table",
    file="undefined",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Raster(mark="raster", data=PlotFrom(from_="gaia", filterBy=$brush), x=ChannelValueSpec(ChannelValue("u")), y=ChannelValueSpec(ChannelValue("v")), fill=ChannelValueSpec(ChannelValue("density")))),
        PlotMark()
    ],
    width=440,
    height=250
)