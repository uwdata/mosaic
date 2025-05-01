import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Athlete Birth Waffle",
    "description": "Waffle chart counting Olympic athletes based on which half-decade they were born. The inputs enable adjustment of waffle mark design options.\n",
    "credit": "Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-waffle-unit)."
  },
  "data": {
    "athletes": {
      "file": "data/athletes.parquet"
    }
  },
  "params": {
    "unit": 10,
    "round": false,
    "gap": 1,
    "radius": 0
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "input": "menu",
          "as": "$unit",
          "options": [
            1,
            2,
            5,
            10,
            25,
            50,
            100
          ],
          "label": "Unit"
        },
        {
          "input": "menu",
          "as": "$round",
          "options": [
            true,
            false
          ],
          "label": "Round"
        },
        {
          "input": "menu",
          "as": "$gap",
          "options": [
            0,
            1,
            2,
            3,
            4,
            5
          ],
          "label": "Gap"
        },
        {
          "input": "slider",
          "as": "$radius",
          "min": 0,
          "max": 10,
          "step": 0.1,
          "label": "Radius"
        }
      ]
    },
    {
      "vspace": 10
    },
    {
      "plot": [
        {
          "mark": "waffleY",
          "data": {
            "from": "athletes"
          },
          "unit": "$unit",
          "round": "$round",
          "gap": "$gap",
          "rx": "$radius",
          "x": {
            "sql": "5 * floor(year(\"date_of_birth\") / 5)"
          },
          "y": {
            "count": null
          }
        }
      ],
      "xLabel": null,
      "xTickSize": 0,
      "xTickFormat": "d"
    }
  ]
};
