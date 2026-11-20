import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Sketch Aggregates",
    "description": "Brush the height histogram to update the median weight and the number of distinct nationalities per sport. Exact medians and distinct counts can not be pre-aggregated, so by default each update queries the filtered rows. With [sketch aggregates](https://idl.uw.edu/mosaic/api/core/coordinator#sketch-aggregates) enabled, Mosaic instead pre-aggregates approximate results using mergeable sketches. Without sketches, the example works the same and shows exact results; sketches trade a small error for faster updates on large data.\n"
  },
  "data": {
    "athletes": {
      "file": "data/athletes.parquet"
    }
  },
  "params": {
    "brush": {
      "select": "intersect"
    }
  },
  "vconcat": [
    {
      "plot": [
        {
          "mark": "rectY",
          "data": {
            "from": "athletes"
          },
          "x": {
            "bin": "height"
          },
          "y": {
            "count": null
          },
          "fill": "steelblue",
          "inset": 0.5
        },
        {
          "select": "intervalX",
          "as": "$brush"
        }
      ],
      "xLabel": "Height (m) →",
      "yLabel": "↑ Athletes",
      "width": 700,
      "height": 150
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "mark": "barX",
              "data": {
                "from": "athletes",
                "filterBy": "$brush"
              },
              "x": {
                "median": "weight"
              },
              "y": "sport",
              "fill": "steelblue",
              "sort": {
                "y": "-x"
              }
            }
          ],
          "xLabel": "Median weight (kg) →",
          "yLabel": null,
          "marginLeft": 110,
          "width": 350,
          "height": 500
        },
        {
          "plot": [
            {
              "mark": "barX",
              "data": {
                "from": "athletes",
                "filterBy": "$brush"
              },
              "x": {
                "count": "nationality",
                "distinct": true
              },
              "y": "sport",
              "fill": "steelblue",
              "sort": {
                "y": "-x"
              }
            }
          ],
          "xLabel": "Distinct nationalities →",
          "yLabel": null,
          "marginLeft": 110,
          "width": 350,
          "height": 500
        }
      ]
    }
  ]
};
