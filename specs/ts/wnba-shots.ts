import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "WNBA Shot Chart",
    "description": "Every field goal attempt in the 2023 WNBA regular season. Shots are grouped into hexagonal bins, with color indicating shot potency (average score) and size indicating the total count of shots per location. The menu filters isolate shots by team or athlete.\n",
    "credit": "Data from [Wehoop](https://wehoop.sportsdataverse.org/). Design inspired by [Kirk Goldsberry](https://en.wikipedia.org/wiki/Kirk_Goldsberry) and a [UW CSE 512](https://courses.cs.washington.edu/courses/cse512/24sp/) project by Mackenzie Pitts and Madeline Brown.\n"
  },
  "data": {
    "shots": {
      "file": "data/wnba-shots-2023.parquet",
      "where": "NOT starts_with(type, 'Free Throw') AND season_type = 2"
    },
    "court": {
      "file": "data/wnba-half-court.parquet"
    }
  },
  "params": {
    "filter": {
      "select": "crossfilter"
    },
    "binWidth": 18
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "input": "menu",
          "from": "shots",
          "column": "team_name",
          "as": "$filter",
          "label": "Team"
        },
        {
          "input": "menu",
          "from": "shots",
          "column": "athlete_name",
          "filterBy": "$filter",
          "as": "$filter",
          "label": "Athlete"
        }
      ]
    },
    {
      "vspace": 5
    },
    {
      "plot": [
        {
          "mark": "frame",
          "strokeOpacity": 0.5
        },
        {
          "mark": "hexgrid",
          "binWidth": "$binWidth",
          "strokeOpacity": 0.05
        },
        {
          "mark": "hexbin",
          "data": {
            "from": "shots",
            "filterBy": "$filter"
          },
          "binWidth": "$binWidth",
          "x": "x_position",
          "y": "y_position",
          "fill": {
            "avg": "score_value"
          },
          "r": {
            "count": null
          },
          "tip": {
            "format": {
              "x": false,
              "y": false
            }
          }
        },
        {
          "mark": "line",
          "data": {
            "from": "court"
          },
          "strokeLinecap": "butt",
          "strokeOpacity": 0.5,
          "x": "x",
          "y": "y",
          "z": "z"
        }
      ],
      "name": "shot-chart",
      "xAxis": null,
      "yAxis": null,
      "margin": 5,
      "xDomain": [
        0,
        50
      ],
      "yDomain": [
        0,
        40
      ],
      "colorDomain": "Fixed",
      "colorScheme": "YlOrRd",
      "colorScale": "linear",
      "colorLabel": "Avg. Shot Value",
      "rScale": "log",
      "rRange": [
        3,
        9
      ],
      "rLabel": "Shot Count",
      "aspectRatio": 1,
      "width": 510
    },
    {
      "legend": "color",
      "for": "shot-chart"
    }
  ]
};
