from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


flights = DataSource(
    type="parquet",
    file="data/flights-200k.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(DensityY(mark="densityY", data=PlotFrom(from_="flights", filterBy=$brush), x=ChannelValueSpec(ChannelValue("delay")), fill=ChannelValueSpec(ChannelValue("#888")), fillOpacity=0.5)),
        PlotMark()
    ],
    width=600,
    height=200
)