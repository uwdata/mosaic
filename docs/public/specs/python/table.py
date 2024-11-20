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

    ],
    width=None,
    height=300
)