import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Cross-Filter Flights (10M)",
    "description": "Histograms showing arrival delay, departure time, and distance flown for 10 million flights.\nOnce loaded, automatic pre-aggregation optimizations enable efficient cross-filtered selections.\n\n_You may need to wait a few seconds for the dataset to load._\n"
  },
  "data": {
    "flights10m": "SELECT GREATEST(-60, LEAST(ARR_DELAY, 180))::DOUBLE AS delay, DISTANCE AS distance, DEP_TIME AS time FROM 'https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/data/flights-10m.parquet'"
  },
  "params": {
    "brush": {
      "select": "crossfilter"
    }
  },
  "vconcat": [
    {
      "plot": [
        {
          "mark": "rectY",
          "data": {
            "from": "flights10m",
            "filterBy": "$brush"
          },
          "x": {
            "bin": "delay"
          },
          "y": {
            "count": null
          },
          "fill": "steelblue",
          "insetLeft": 0.5,
          "insetRight": 0.5
        },
        {
          "select": "intervalX",
          "as": "$brush"
        }
      ],
      "xDomain": "Fixed",
      "xLabel": "Arrival Delay (min)",
      "yTickFormat": "s",
      "width": 600,
      "height": 200
    },
    {
      "plot": [
        {
          "mark": "rectY",
          "data": {
            "from": "flights10m",
            "filterBy": "$brush"
          },
          "x": {
            "bin": "time"
          },
          "y": {
            "count": null
          },
          "fill": "steelblue",
          "insetLeft": 0.5,
          "insetRight": 0.5
        },
        {
          "select": "intervalX",
          "as": "$brush"
        }
      ],
      "xDomain": "Fixed",
      "xLabel": "Departure Time (hour)",
      "yTickFormat": "s",
      "width": 600,
      "height": 200
    },
    {
      "plot": [
        {
          "mark": "rectY",
          "data": {
            "from": "flights10m",
            "filterBy": "$brush"
          },
          "x": {
            "bin": "distance"
          },
          "y": {
            "count": null
          },
          "fill": "steelblue",
          "insetLeft": 0.5,
          "insetRight": 0.5
        },
        {
          "select": "intervalX",
          "as": "$brush"
        }
      ],
      "xDomain": "Fixed",
      "xLabel": "Flight Distance (miles)",
      "yTickFormat": "s",
      "width": 600,
      "height": 200
    }
  ]
};
