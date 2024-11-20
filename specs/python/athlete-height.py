from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


athletesBatched = DataSource(
    type="parquet",
    file="data/athletes.parquet",
    where="height IS NOT NULL"
)

spec = Plot(
    plot=[
        PlotMark(ErrorbarX(mark="errorbarX", data=PlotFrom(from_="athletesBatched", filterBy=$query), x=ChannelValueSpec(ChannelValue("height")), y=ChannelValueSpec(ChannelValue("sport")), stroke=ChannelValueSpec(ChannelValue("sex")), strokeWidth=1)),
        PlotMark(Text(mark="text", data=PlotFrom(from_="athletesBatched"), y=ChannelValueSpec(ChannelValue("sport")), fill=ChannelValueSpec(ChannelValue("#999")), frameAnchor="right"))
    ],
    width=None,
    height=420
)