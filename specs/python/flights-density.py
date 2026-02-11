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
        PlotMark(Heatmap(mark="heatmap", data=PlotFrom(from_="flights"), x=ChannelValueSpec(ChannelValue("time")), y=ChannelValueSpec(ChannelValue("delay")), fill=ChannelValueSpec(ChannelValue("density")))),
        PlotMark(Contour(mark="contour", data=PlotFrom(from_="flights"), x=ChannelValueSpec(ChannelValue("time")), y=ChannelValueSpec(ChannelValue("delay")), stroke=ChannelValueSpec(ChannelValue("white")), strokeOpacity=0.5))
    ],
    width=700,
    height=500
)