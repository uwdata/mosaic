import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Moving Average",
    "description": "This plot shows daily reported COVID-19 cases from March 3 (day 1) to May 5, 2020 (day 64) in Berlin, Germany, as reported by the [Robert Koch Institute](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/nCoV.html). We can smooth the raw counts using a moving average over various choices of window query frames.\n",
    "credit": "Adapted from the [Arquero window query tutorial](https://observablehq.com/@uwdata/working-with-window-queries)."
  },
  "data": {
    "cases": {
      "file": "data/berlin-covid.parquet"
    }
  },
  "params": {
    "frame": [
      -6,
      0
    ]
  },
  "vconcat": [
    {
      "plot": [
        {
          "mark": "rectY",
          "data": {
            "from": "cases"
          },
          "x1": "day",
          "x2": {
            "sql": "day + 1"
          },
          "inset": 1,
          "y": "cases",
          "fill": "steelblue"
        },
        {
          "mark": "lineY",
          "data": {
            "from": "cases"
          },
          "x": {
            "sql": "day + 0.5"
          },
          "y": {
            "avg": "cases",
            "orderby": "day",
            "rows": "$frame"
          },
          "curve": "monotone-x",
          "stroke": "currentColor"
        }
      ],
      "xLabel": "day",
      "width": 680,
      "height": 300
    },
    {
      "input": "menu",
      "label": "Window Frame",
      "as": "$frame",
      "options": [
        {
          "label": "7-day moving average, with prior 6 days: [-6, 0]",
          "value": [
            -6,
            0
          ]
        },
        {
          "label": "7-day moving average, centered at current day: [-3, 3]",
          "value": [
            -3,
            3
          ]
        },
        {
          "label": "Moving average, with all prior days [-∞, 0]",
          "value": [
            null,
            0
          ]
        },
        {
          "label": "Global average [-∞, +∞]",
          "value": [
            null,
            null
          ]
        }
      ]
    }
  ]
};
