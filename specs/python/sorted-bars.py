from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


athletes = DataSource(
    type="parquet",
    file="data/athletes.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(BarX(mark="barX", data=PlotFrom(from_="athletes", filterBy=$query), x=ChannelValueSpec(ChannelValue({"sum":"gold"})), y=ChannelValueSpec(ChannelValue("nationality")), fill=ChannelValueSpec(ChannelValue("steelblue"))))
    ],
    width=None,
    height=None
)