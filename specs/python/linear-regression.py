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
        PlotMark(Dot(mark="dot", data=PlotFrom(from_="athletes"), x=ChannelValueSpec(ChannelValue("weight")), y=ChannelValueSpec(ChannelValue("height")), fill=ChannelValueSpec(ChannelValue("sex")), r=2)),
        PlotMark(RegressionY(mark="regressionY", data=PlotFrom(from_="athletes", filterBy=$query), x=ChannelValueSpec(ChannelValue("weight")), y=ChannelValueSpec(ChannelValue("height")), stroke=ChannelValueSpec(ChannelValue("sex")))),
        PlotMark()
    ],
    width=None,
    height=None
)