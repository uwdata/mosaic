from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


stocks_after_2006 = DataSource(
    type="parquet",
    file="data/stocks_after_2006.parquet",
    where="Close < 100"
)

spec = Plot(
    plot=[
        PlotMark(DenseLine(mark="denseLine", data=PlotFrom(from_="stocks_after_2006", filterBy=$brush), x=ChannelValueSpec(ChannelValue("Date")), y=ChannelValueSpec(ChannelValue("Close")), z=ChannelValueSpec(ChannelValue("Symbol")), fill=ChannelValueSpec(ChannelValue("density"))))
    ],
    width=680,
    height=240
)