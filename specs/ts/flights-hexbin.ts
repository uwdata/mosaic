import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Flights Hexbin",
    "description": "Hexagonal bins show the density of over 200,000 flights by departure time and arrival delay. Select regions in the marginal histograms to filter the density display.\n"
  },
  "data": {
    "flights": {
      "file": "data/flights-200k.parquet"
    }
  },
  "params": {
    "scale": {
      "value": "log"
    },
    "query": {
      "select": "intersect"
    }
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "input": "menu",
          "label": "Color Scale",
          "as": "$scale",
          "options": [
            "log",
            "linear",
            "sqrt"
          ]
        },
        {
          "hspace": 10
        },
        {
          "legend": "color",
          "for": "hexbins"
        }
      ]
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "mark": "rectY",
              "data": {
                "from": "flights"
              },
              "x": {
                "bin": "time"
              },
              "y": {
                "count": null
              },
              "fill": "steelblue",
              "inset": 0.5
            },
            {
              "select": "intervalX",
              "as": "$query"
            }
          ],
          "margins": {
            "left": 5,
            "right": 5,
            "top": 30,
            "bottom": 0
          },
          "xDomain": "Fixed",
          "xAxis": "top",
          "yAxis": null,
          "xLabelAnchor": "center",
          "width": 605,
          "height": 70
        },
        {
          "hspace": 80
        }
      ]
    },
    {
      "hconcat": [
        {
          "name": "hexbins",
          "plot": [
            {
              "mark": "hexbin",
              "data": {
                "from": "flights",
                "filterBy": "$query"
              },
              "x": "time",
              "y": "delay",
              "fill": {
                "count": null
              },
              "binWidth": 10
            },
            {
              "mark": "hexgrid",
              "binWidth": 10
            }
          ],
          "colorScheme": "ylgnbu",
          "colorScale": "$scale",
          "margins": {
            "left": 5,
            "right": 0,
            "top": 0,
            "bottom": 5
          },
          "xAxis": null,
          "yAxis": null,
          "xyDomain": "Fixed",
          "width": 600,
          "height": 455
        },
        {
          "plot": [
            {
              "mark": "rectX",
              "data": {
                "from": "flights"
              },
              "x": {
                "count": null
              },
              "y": {
                "bin": "delay"
              },
              "fill": "steelblue",
              "inset": 0.5
            },
            {
              "select": "intervalY",
              "as": "$query"
            }
          ],
          "margins": {
            "left": 0,
            "right": 50,
            "top": 4,
            "bottom": 5
          },
          "yDomain": [
            -60,
            180
          ],
          "xAxis": null,
          "yAxis": "right",
          "yLabelAnchor": "center",
          "width": 80,
          "height": 455
        }
      ]
    }
  ]
};
