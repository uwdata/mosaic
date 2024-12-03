from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


walk = DataSource(
    type="parquet",
    file="data/random-walk.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(AreaY(mark="areaY", data=PlotFrom(from_="walk"), x=ChannelValueSpec(ChannelValue("t")), y=ChannelValueSpec(ChannelValue(sql="v + $point")), fill=ChannelValueSpec(ChannelValue("steelblue"))))
    ],
    width=680,
    height=200
)