import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Line Multi-Series",
    "description": "This line chart shows the unemployment rate of various U.S. metro divisions from 2000 through 2013. On hover, the closest data point to the pointer and its associated series is highlighted. Highlighting of series is performed using `nearestX` and `highlight` interactors. Point and text annotations instead use the mark `select` filter option.\n",
    "credit": "Adapted from a [D3 example](https://observablehq.com/@d3/multi-line-chart/2). Data from the [Bureau of Labor Statistics](https://www.bls.gov/).\n"
  },
  "data": {
    "bls_unemp": {
      "file": "data/bls-metro-unemployment.parquet"
    }
  },
  "plot": [
    {
      "mark": "ruleY",
      "data": [
        0
      ]
    },
    {
      "mark": "lineY",
      "data": {
        "from": "bls_unemp",
        "optimize": false
      },
      "x": "date",
      "y": "unemployment",
      "z": "division",
      "stroke": "steelblue",
      "curve": "monotone-x",
      "mixBlendMode": "multiply"
    },
    {
      "select": "nearestX",
      "channels": [
        "z"
      ],
      "as": "$curr"
    },
    {
      "select": "highlight",
      "by": "$curr"
    },
    {
      "mark": "dot",
      "data": {
        "from": "bls_unemp"
      },
      "x": "date",
      "y": "unemployment",
      "z": "division",
      "r": 2,
      "fill": "currentColor",
      "select": "nearestX"
    },
    {
      "mark": "text",
      "data": {
        "from": "bls_unemp"
      },
      "x": "date",
      "y": "unemployment",
      "text": "division",
      "fill": "currentColor",
      "dy": -8,
      "select": "nearestX"
    }
  ],
  "marginLeft": 24,
  "xLabel": null,
  "xTicks": 10,
  "yLabel": "Unemployment (%)",
  "yGrid": true,
  "style": "overflow: visible;",
  "width": 680
};
