from mosaic import *
from mosaic.spec import *
from mosaic.generated_classes import *
from typing import Dict, Any, Union



spec = Plot(
    plot=[
        PlotMark(GridY(mark="gridY", strokeOpacity=1)),
        PlotMark(AxisY(mark="axisY", dy=-4)),
        PlotMark(AxisY(mark="axisY")),
        PlotMark(AxisX(mark="axisX")),
        PlotMark(GridX(mark="gridX")),
        PlotMark(RuleY(mark="ruleY"))
    ],
    width=680,
    height=None
)