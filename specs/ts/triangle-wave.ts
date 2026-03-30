import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Triangle Wave",
    "description": "A test specification to compare M4 optimized and unoptimized line charts.\n"
  },
  "data": {
    "wave": {
      "file": "data/triangle-wave-day.csv"
    }
  },
  "vconcat": [
    {
      "plot": [
        {
          "mark": "lineY",
          "data": {
            "from": "wave"
          },
          "x": "time_stamp",
          "y": "power",
          "z": null,
          "stroke": "time_stamp"
        },
        {
          "select": "intervalX",
          "as": "$brush"
        }
      ],
      "xLabel": null,
      "width": 680,
      "height": 150
    },
    {
      "vspace": 5
    },
    {
      "plot": [
        {
          "mark": "lineY",
          "data": {
            "from": "wave",
            "filterBy": "$brush"
          },
          "x": "time_stamp",
          "y": "power",
          "z": null,
          "stroke": "time_stamp"
        }
      ],
      "yDomain": "Fixed",
      "colorDomain": "Fixed",
      "xLabel": null,
      "width": 680,
      "height": 150
    },
    {
      "vspace": 5
    },
    {
      "plot": [
        {
          "mark": "lineY",
          "data": {
            "from": "wave",
            "filterBy": "$brush",
            "optimize": false
          },
          "x": "time_stamp",
          "y": "power",
          "z": null,
          "stroke": "time_stamp"
        }
      ],
      "yDomain": "Fixed",
      "colorDomain": "Fixed",
      "xLabel": null,
      "width": 680,
      "height": 150
    }
  ]
};
