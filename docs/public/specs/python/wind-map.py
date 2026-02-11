from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


wind = DataSource(
    type="parquet",
    file="data/wind.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Vector(mark="vector", data=PlotFrom(from_="wind"), x=ChannelValueSpec(ChannelValue("longitude")), y=ChannelValueSpec(ChannelValue("latitude")), stroke=ChannelValueSpec(ChannelValue(sql="sqrt(u * u + v * v)")), rotate=ChannelValueSpec(ChannelValue(sql="degrees(atan2(u, v))")), length=ChannelValueSpec(ChannelValue(sql="$length * sqrt(u * u + v * v)"))))
    ],
    width=680,
    height=None
)