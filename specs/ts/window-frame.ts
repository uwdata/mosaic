import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "data": {
    "aapl": {
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
      "stroke": "#ccc",
      "x": "Date",
      "y": "Close"
    },
    {
      "mark": "lineY",
      "data": {
        "from": "aapl"
      },
      "stroke": "black",
      "x": "Date",
      "y": {
        "avg": "Close",
        "orderby": "Date",
        "range": [
          {
            "days": 15
          },
          {
            "days": 15
          }
        ]
      }
    },
    {
      "mark": "lineY",
      "data": {
        "from": "aapl"
      },
      "stroke": "firebrick",
      "x": "Date",
      "y": {
        "avg": "Close",
        "orderby": "Date",
        "range": [
          {
            "months": 3
          },
          {
            "months": 3
          }
        ]
      }
    }
  ],
  "yLabel": "Close",
  "width": 680,
  "height": 200
};
