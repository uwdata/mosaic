from mosaic_spec import *
from typing import Dict, Any, Union

spec = {
  "meta": {
    "title": "Line Density",
    "description": "The `denseLine` mark shows the densities of line series, here for a collection of stock prices. The top plot normalizes by arc length to remove the vertical artifacts visible in the unnormalized plot below. Select a region in the lower plot to zoom the upper plot. The bandwidth slider smooths the data, while the pixel size menu adjusts the raster resolution.\n"
  },
  "data": {
    "stocks_after_2006": {
      "type": "parquet",
      "file": "data/stocks_after_2006.parquet",
      "select": [
        "Symbol",
        "Close",
        "Date"
      ],
      "where": "Close < 100"
    }
  },
  "params": {
    "brush": {
      "select": "intersect"
    },
    "bandwidth": 0,
    "pixelSize": 2,
    "schemeColor": "pubugn",
    "scaleColor": "sqrt"
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "input": "slider",
          "label": "Bandwidth (σ)",
          "as": "$bandwidth",
          "min": 0,
          "max": 10,
          "step": 0.1
        },
        {
          "input": "menu",
          "label": "Pixel Size",
          "as": "$pixelSize",
          "options": [
            0.5,
            1,
            2
          ]
        }
      ]
    },
    {
      "vspace": 10
    },
    {
      "plot": [
        {
          "mark": "denseLine",
          "data": {
            "from": "stocks_after_2006",
            "filterBy": "$brush"
          },
          "x": "Date",
          "y": "Close",
          "z": "Symbol",
          "fill": "density",
          "bandwidth": "$bandwidth",
          "pixelSize": "$pixelSize"
        }
      ],
      "colorScheme": "$schemeColor",
      "colorScale": "$scaleColor",
      "yLabel": "Close (Normalized) ↑",
      "yNice": True,
      "margins": {
        "left": 30,
        "top": 20,
        "right": 0
      },
      "width": 680,
      "height": 240
    },
    {
      "plot": [
        {
          "mark": "denseLine",
          "data": {
            "from": "stocks_after_2006"
          },
          "x": "Date",
          "y": "Close",
          "z": "Symbol",
          "fill": "density",
          "normalize": False,
          "bandwidth": "$bandwidth",
          "pixelSize": "$pixelSize"
        },
        {
          "select": "intervalXY",
          "as": "$brush"
        }
      ],
      "colorScheme": "$schemeColor",
      "colorScale": "$scaleColor",
      "yLabel": "Close (Unnormalized) ↑",
      "yNice": True,
      "margins": {
        "left": 30,
        "top": 20,
        "right": 0
      },
      "width": 680,
      "height": 240
    }
  ]
}
