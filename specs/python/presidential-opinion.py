from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


presidents = DataSource(
    type="parquet",
    file="data/us-president-favorability.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(RuleY(mark="ruleY")),
        PlotMark(Image(mark="image", data=PlotFrom(from_="presidents"), x=ChannelValueSpec(ChannelValue("First Inauguration Date")), y=ChannelValueSpec(ChannelValue(sql=""Very Favorable %" + "Somewhat Favorable %" + $sign * ("Very Unfavorable %" + "Somewhat Unfavorable %")")), r=20, title=ChannelValueSpec(ChannelValue("Name"))))
    ],
    width=None,
    height=None
)