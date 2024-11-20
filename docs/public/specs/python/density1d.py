from mosaic_spec import *
from typing import Dict, Any, Union

spec = {
  "meta": {
    "title": "Density 1D",
    "description": "Density plots (`densityY` mark) for over 200,000 flights, created using kernel density estimation. Binning is performned in-database, subsequent smoothing in-browser. The distance density uses a log-scaled domain. To change the amount of smoothing, use the slider to set the kernel bandwidth.\n"
  },
  "data": {
    "flights": {
      "type": "parquet",
      "file": "data/flights-200k.parquet"
    }
  },
  "params": {
    "brush": {
      "select": "crossfilter"
    },
    "bandwidth": 20
  },
  "vconcat": [
    {
      "input": "slider",
      "label": "Bandwidth (σ)",
      "as": "$bandwidth",
      "min": 0.1,
      "max": 100,
      "step": 0.1
    },
    {
      "plot": [
        {
          "mark": "densityY",
          "data": {
            "from": "flights",
            "filterBy": "$brush"
          },
          "x": "delay",
          "fill": "#888",
          "fillOpacity": 0.5,
          "bandwidth": "$bandwidth"
        },
        {
          "select": "intervalX",
          "as": "$brush"
        }
      ],
      "yAxis": None,
      "xDomain": "Fixed",
      "width": 600,
      "marginLeft": 10,
      "height": 200
    },
    {
      "plot": [
        {
          "mark": "densityY",
          "data": {
            "from": "flights",
            "filterBy": "$brush"
          },
          "x": "distance",
          "fill": "#888",
          "fillOpacity": 0.5,
          "bandwidth": "$bandwidth"
        },
        {
          "select": "intervalX",
          "as": "$brush"
        }
      ],
      "yAxis": None,
      "xScale": "log",
      "xDomain": "Fixed",
      "width": 600,
      "marginLeft": 10,
      "height": 200
    }
  ]
}
