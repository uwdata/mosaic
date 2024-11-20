from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


rides = DataSource(
    type="parquet",
    file="https://idl.uw.edu/mosaic-datasets/data/nyc-rides-2010.parquet",
    where=""
)
trips = DataSource(
    type="table",
    file="undefined",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Raster(mark="raster", data=PlotFrom(from_="trips", filterBy=$filter), x=ChannelValueSpec(ChannelValue("px")), y=ChannelValueSpec(ChannelValue("py")))),
        PlotMark(),
        PlotMark(Text(mark="text", fill=ChannelValueSpec(ChannelValue("black")), frameAnchor="top-left", dy=10))
    ],
    width=335,
    height=550,
    margin=0
)