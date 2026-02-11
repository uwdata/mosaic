from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


shots = DataSource(
    type="parquet",
    file="data/wnba-shots-2023.parquet",
    where="NOT starts_with(type, 'Free Throw') AND season_type = 2"
)
court = DataSource(
    type="parquet",
    file="data/wnba-half-court.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Frame(mark="frame", strokeOpacity=0.5)),
        PlotMark(Hexgrid(mark="hexgrid", strokeOpacity=0.05, binWidth=$binWidth)),
        PlotMark(Hexbin(mark="hexbin", data=PlotFrom(from_="shots", filterBy=$filter), x=ChannelValueSpec(ChannelValue("x_position")), y=ChannelValueSpec(ChannelValue("y_position")), fill=ChannelValueSpec(ChannelValue(avg="score_value")), r=ChannelValueSpec(ChannelValue(count="")), tip={"format": {"x":false,"y":false}}, binWidth=$binWidth)),
        PlotMark(Line(mark="line", data=PlotFrom(from_="court"), x=ChannelValueSpec(ChannelValue("x")), y=ChannelValueSpec(ChannelValue("y")), z=ChannelValueSpec(ChannelValue("z")), strokeOpacity=0.5, strokeLinecap="butt"))
    ],
    width=510,
    height=None,
    margin=5
)