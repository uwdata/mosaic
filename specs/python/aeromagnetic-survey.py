from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


ca55 = DataSource(
    type="parquet",
    file="data/ca55-south.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Raster(mark="raster", data=PlotFrom(from_="ca55"), x=ChannelValueSpec(ChannelValue("LONGITUDE")), y=ChannelValueSpec(ChannelValue("LATITUDE")), fill=ChannelValueSpec(ChannelValue({"max":"MAG_IGRF90"}))))
    ],
    width=None,
    height=None
)