import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Driving Shifts into Reverse",
    "description": "A connected scatter plot of miles driven vs. gas prices.",
    "credit": "Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-connected-scatterplot), which in turn adapts Hannah Fairfield's [New York Times article](http://www.nytimes.com/imagepages/2010/05/02/business/02metrics.html).\n"
  },
  "data": {
    "driving": {
      "file": "data/driving.parquet"
    }
  },
  "plot": [
    {
      "mark": "line",
      "data": {
        "from": "driving"
      },
      "x": "miles",
      "y": "gas",
      "curve": "catmull-rom",
      "marker": true
    },
    {
      "mark": "text",
      "data": {
        "from": "driving"
      },
      "x": "miles",
      "y": "gas",
      "text": {
        "sql": "year::VARCHAR"
      },
      "dy": -6,
      "lineAnchor": "bottom",
      "filter": {
        "sql": "year % 5 = 0"
      }
    }
  ],
  "inset": 10,
  "grid": true,
  "xLabel": "Miles driven (per person-year)",
  "yLabel": "Cost of gasoline ($ per gallon)"
};
