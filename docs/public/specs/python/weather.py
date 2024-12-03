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
        PlotMark(Dot(mark="dot", data=PlotFrom(from_="weather", filterBy=$click), x=ChannelValueSpec(ChannelValue(dateMonthDay="date")), y=ChannelValueSpec(ChannelValue("temp_max")), fill=ChannelValueSpec(ChannelValue("weather")), fillOpacity=0.7, r=ChannelValueSpec(ChannelValue("precipitation")))),
        PlotMark(),
        PlotMark(),
        PlotMark()
    ],
    width=680,
    height=300
)