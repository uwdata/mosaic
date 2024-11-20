from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


travelers = DataSource(
    type="parquet",
    file="data/travelers.parquet",
    where=""
)
endpoint = DataSource(
    type="table",
    file="undefined",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(RuleY(mark="ruleY")),
        PlotMark(LineY(mark="lineY", data=PlotFrom(from_="travelers"), x=ChannelValueSpec(ChannelValue("date")), y=ChannelValueSpec(ChannelValue("previous")), strokeOpacity=0.35)),
        PlotMark(LineY(mark="lineY", data=PlotFrom(from_="travelers"), x=ChannelValueSpec(ChannelValue("date")), y=ChannelValueSpec(ChannelValue("current")))),
        PlotMark(Text(mark="text", data=PlotFrom(from_="endpoint"), x=ChannelValueSpec(ChannelValue("date")), y=ChannelValueSpec(ChannelValue("previous")), fillOpacity=0.5, dy=-6)),
        PlotMark(Text(mark="text", data=PlotFrom(from_="endpoint"), x=ChannelValueSpec(ChannelValue("date")), y=ChannelValueSpec(ChannelValue("current")), dy=6))
    ],
    width=None,
    height=None
)