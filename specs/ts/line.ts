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
      "x": "Date",
      "y": "Close"
    }
  ],
  "width": 680,
  "height": 200
};
