import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Athlete Height Intervals",
    "description": "Confidence intervals of Olympic athlete heights, in meters. Data are batched into groups of 10 samples per sport. Use the samples slider to see how the intervals update as the sample size increases (as in [online aggregation](https://en.wikipedia.org/wiki/Online_aggregation)). For each sport, the numbers on the right show the maximum number of athletes in the full dataset.\n"
  },
  "data": {
    "athletesBatched": {
      "file": "data/athletes.parquet",
      "select": [
        "*",
        "10 * CEIL(ROW_NUMBER() OVER (PARTITION BY sport) / 10) AS batch"
      ],
      "where": "height IS NOT NULL"
    }
  },
  "params": {
    "ci": 0.95,
    "query": {
      "select": "single"
    }
  },
  "hconcat": [
    {
      "vconcat": [
        {
          "hconcat": [
            {
              "input": "slider",
              "select": "interval",
              "as": "$query",
              "column": "batch",
              "from": "athletesBatched",
              "step": 10,
              "value": 20,
              "label": "Max Samples"
            },
            {
              "input": "slider",
              "as": "$ci",
              "min": 0.5,
              "max": 0.999,
              "step": 0.001,
              "label": "Conf. Level"
            }
          ]
        },
        {
          "name": "heights",
          "plot": [
            {
              "mark": "errorbarX",
              "data": {
                "from": "athletesBatched",
                "filterBy": "$query"
              },
              "ci": "$ci",
              "x": "height",
              "y": "sport",
              "stroke": "sex",
              "strokeWidth": 1,
              "marker": "tick",
              "sort": {
                "y": "-x"
              }
            },
            {
              "mark": "text",
              "data": {
                "from": "athletesBatched"
              },
              "frameAnchor": "right",
              "fontSize": 8,
              "fill": "#999",
              "dx": 25,
              "text": {
                "count": null
              },
              "y": "sport"
            }
          ],
          "xDomain": [
            1.5,
            2.1
          ],
          "yDomain": "Fixed",
          "yGrid": true,
          "yLabel": null,
          "marginTop": 5,
          "marginLeft": 105,
          "marginRight": 30,
          "height": 420
        },
        {
          "legend": "color",
          "for": "heights"
        }
      ]
    }
  ]
};
