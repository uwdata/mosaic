from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


aapl = DataSource(
    type="parquet",
    file="data/stocks.parquet",
    where="Symbol = 'AAPL'"
)

spec = Plot(
    plot=[
        PlotMark(LineY(mark="lineY", data=PlotFrom(from_="aapl"), x=ChannelValueSpec(ChannelValue("Date")), y=ChannelValueSpec(ChannelValue("Close"))))
    ],
    width=680,
    height=200
)