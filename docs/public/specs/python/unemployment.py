from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


counties = DataSource(
    type="spatial",
    file="data/us-counties-10m.json",
    where=""
)
rates = DataSource(
    type="parquet",
    file="data/us-county-unemployment.parquet",
    where=""
)
combined = DataSource(
    type="table",
    file="undefined",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Geo(mark="geo", data=PlotFrom(from_="combined"), fill=ChannelValueSpec(ChannelValue("rate")), title=ChannelValueSpec(ChannelValue(sql="concat(rate, '%')"))))
    ],
    width=None,
    height=None,
    margin=0
)