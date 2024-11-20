from mosaic_spec import *
from typing import Dict, Any, Union

spec = {
  "meta": {
    "title": "Aeromagnetic Survey",
    "description": "A raster visualization of the 1955 [Great Britain aeromagnetic survey](https://www.bgs.ac.uk/datasets/gb-aeromagnetic-survey/), which measured the Earth’s magnetic field by plane. Each sample recorded the longitude and latitude alongside the strength of the [IGRF](https://www.ncei.noaa.gov/products/international-geomagnetic-reference-field) in [nanoteslas](https://en.wikipedia.org/wiki/Tesla_(unit)). This example demonstrates both raster interpolation and smoothing (blur) options.\n",
    "credit": "Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-igfr90-raster)."
  },
  "data": {
    "ca55": {
      "type": "parquet",
      "file": "data/ca55-south.parquet"
    }
  },
  "params": {
    "interp": "random-walk",
    "blur": 0
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "input": "menu",
          "label": "Interpolation Method",
          "options": [
            "none",
            "nearest",
            "barycentric",
            "random-walk"
          ],
          "as": "$interp"
        },
        {
          "hspace": "1em"
        },
        {
          "input": "slider",
          "label": "Blur",
          "min": 0,
          "max": 100,
          "as": "$blur"
        }
      ]
    },
    {
      "vspace": "1em"
    },
    {
      "plot": [
        {
          "mark": "raster",
          "data": {
            "from": "ca55"
          },
          "x": "LONGITUDE",
          "y": "LATITUDE",
          "fill": {
            "max": "MAG_IGRF90"
          },
          "interpolate": "$interp",
          "bandwidth": "$blur"
        }
      ],
      "colorScale": "diverging",
      "colorDomain": "Fixed"
    }
  ]
}
