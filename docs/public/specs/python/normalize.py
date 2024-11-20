from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


stocks = DataSource(
    type="parquet",
    file="data/stocks.parquet",
    where=""
)
labels = DataSource(
    type="table",
    file="undefined",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(RuleX(mark="ruleX", x=$point)),
        PlotMark(TextX(mark="textX", x=$point, frameAnchor="top", dy=-7)),
        PlotMark(Text(mark="text", data=PlotFrom(from_="labels"), x=ChannelValueSpec(ChannelValue("Date")), y=ChannelValueSpec(ChannelValue(sql="Close / (SELECT MAX(Close) FROM stocks WHERE Symbol = source.Symbol AND Date = $point)")), fill=ChannelValueSpec(ChannelValue("Symbol")))),
        PlotMark(LineY(mark="lineY", data=PlotFrom(from_="stocks"), x=ChannelValueSpec(ChannelValue("Date")), y=ChannelValueSpec(ChannelValue(sql="Close / (SELECT MAX(Close) FROM stocks WHERE Symbol = source.Symbol AND Date = $point)")), stroke=ChannelValueSpec(ChannelValue("Symbol")))),
        PlotMark()
    ],
    width=680,
    height=400
)