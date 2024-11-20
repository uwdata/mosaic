from mosaic_spec import *
from typing import Dict, Any, Union

spec = {
  "data": {
    "aapl": {
      "type": "parquet",
      "file": "data/stocks.parquet",
      "where": "Symbol = 'AAPL'"
    }
  },
  "plot": [
    {
      "mark": "lineY",
      "data": {
        "from": "aapl"
      },
      "x": "Date",
      "y": "Close"
    }
  ],
  "width": 680,
  "height": 200
}
