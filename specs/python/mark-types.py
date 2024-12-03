from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


md = DataSource(
    type="json",
    file="undefined",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(BarY(mark="barY", data=PlotFrom(from_="md"), x=ChannelValueSpec(ChannelValue("u")), y=ChannelValueSpec(ChannelValue("v")), fill=ChannelValueSpec(ChannelValue("steelblue"))))
    ],
    width=None,
    height=None
)