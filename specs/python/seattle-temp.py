from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


weather = DataSource(
    type="parquet",
    file="data/seattle-weather.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(AreaY(mark="areaY", data=PlotFrom(from_="weather"), x=ChannelValueSpec(ChannelValue({"dateMonth":"date"})), fill=ChannelValueSpec(ChannelValue("#ccc")), fillOpacity=0.25)),
        PlotMark(AreaY(mark="areaY", data=PlotFrom(from_="weather"), x=ChannelValueSpec(ChannelValue({"dateMonth":"date"})), fill=ChannelValueSpec(ChannelValue("steelblue")), fillOpacity=0.75)),
        PlotMark(RuleY(mark="ruleY", strokeOpacity=0.5))
    ],
    width=680,
    height=300
)