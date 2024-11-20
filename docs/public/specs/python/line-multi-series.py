from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


bls_unemp = DataSource(
    type="parquet",
    file="data/bls-metro-unemployment.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(RuleY(mark="ruleY")),
        PlotMark(LineY(mark="lineY", data=PlotFrom(from_="bls_unemp"), x=ChannelValueSpec(ChannelValue("date")), y=ChannelValueSpec(ChannelValue("unemployment")), z=ChannelValueSpec(ChannelValue("division")), stroke=ChannelValueSpec(ChannelValue("steelblue")))),
        PlotMark(),
        PlotMark(),
        PlotMark(Dot(mark="dot", data=PlotFrom(from_="bls_unemp"), x=ChannelValueSpec(ChannelValue("date")), y=ChannelValueSpec(ChannelValue("unemployment")), z=ChannelValueSpec(ChannelValue("division")), fill=ChannelValueSpec(ChannelValue("black")), r=2)),
        PlotMark(Text(mark="text", data=PlotFrom(from_="bls_unemp"), x=ChannelValueSpec(ChannelValue("date")), y=ChannelValueSpec(ChannelValue("unemployment")), fill=ChannelValueSpec(ChannelValue("black")), dy=-8))
    ],
    width=680,
    height=None
)