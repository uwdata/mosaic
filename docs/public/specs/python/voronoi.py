from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union


penguins = DataSource(
    type="parquet",
    file="data/penguins.parquet",
    where=""
)

spec = Plot(
    plot=[
        PlotMark(Voronoi(mark="voronoi", data=PlotFrom(from_="penguins"), x=ChannelValueSpec(ChannelValue("bill_length")), y=ChannelValueSpec(ChannelValue("bill_depth")), fill=ChannelValueSpec(ChannelValue("species")), stroke=ChannelValueSpec(ChannelValue("white")), strokeWidth=1, strokeOpacity=0.5, fillOpacity=0.2)),
        PlotMark(Hull(mark="hull", data=PlotFrom(from_="penguins"), x=ChannelValueSpec(ChannelValue("bill_length")), y=ChannelValueSpec(ChannelValue("bill_depth")), stroke=ChannelValueSpec(ChannelValue("species")), strokeWidth=1.5, strokeOpacity=$hull)),
        PlotMark(DelaunayMesh(mark="delaunayMesh", data=PlotFrom(from_="penguins"), x=ChannelValueSpec(ChannelValue("bill_length")), y=ChannelValueSpec(ChannelValue("bill_depth")), z=ChannelValueSpec(ChannelValue("species")), stroke=ChannelValueSpec(ChannelValue("species")), strokeWidth=1, strokeOpacity=$mesh)),
        PlotMark(Dot(mark="dot", data=PlotFrom(from_="penguins"), x=ChannelValueSpec(ChannelValue("bill_length")), y=ChannelValueSpec(ChannelValue("bill_depth")), fill=ChannelValueSpec(ChannelValue("species")), r=2)),
        PlotMark(Frame(mark="frame"))
    ],
    width=680,
    height=None
)