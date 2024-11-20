from mosaic_spec import *
from typing import Dict, Any, Union

spec = {
  "meta": {
    "title": "Symbol Plots",
    "description": "Two scatter plots with `dot` marks: one with stroked symbols, the other filled.\n"
  },
  "data": {
    "penguins": {
      "type": "parquet",
      "file": "data/penguins.parquet"
    }
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "plot": [
            {
              "mark": "dot",
              "data": {
                "from": "penguins"
              },
              "x": "body_mass",
              "y": "flipper_length",
              "stroke": "species",
              "symbol": "species"
            }
          ],
          "name": "stroked",
          "grid": True,
          "xLabel": "Body mass (g) →",
          "yLabel": "↑ Flipper length (mm)"
        },
        {
          "legend": "symbol",
          "for": "stroked",
          "columns": 1
        }
      ]
    },
    {
      "vspace": 20
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "mark": "dot",
              "data": {
                "from": "penguins"
              },
              "x": "body_mass",
              "y": "flipper_length",
              "fill": "species",
              "symbol": "species"
            }
          ],
          "name": "filled",
          "grid": True,
          "xLabel": "Body mass (g) →",
          "yLabel": "↑ Flipper length (mm)"
        },
        {
          "legend": "symbol",
          "for": "filled",
          "columns": 1
        }
      ]
    }
  ]
}
