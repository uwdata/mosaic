import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Density 2D",
    "description": "A 2D `density` plot in which circle size indicates the point density. The data is divided by fill color into three sets of densities. To change the amount of smoothing, use the slider to set the kernel bandwidth.\n"
  },
  "data": {
    "penguins": {
      "file": "data/penguins.parquet"
    }
  },
  "params": {
    "bandwidth": 20,
    "bins": 20
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "input": "slider",
          "label": "Bandwidth (σ)",
          "as": "$bandwidth",
          "min": 1,
          "max": 100
        },
        {
          "input": "slider",
          "label": "Bins",
          "as": "$bins",
          "min": 10,
          "max": 60
        }
      ]
    },
    {
      "plot": [
        {
          "mark": "density",
          "data": {
            "from": "penguins"
          },
          "x": "bill_length",
          "y": "bill_depth",
          "r": "density",
          "fill": "species",
          "fillOpacity": 0.5,
          "width": "$bins",
          "height": "$bins",
          "bandwidth": "$bandwidth"
        },
        {
          "mark": "dot",
          "data": {
            "from": "penguins"
          },
          "x": "bill_length",
          "y": "bill_depth",
          "fill": "currentColor",
          "r": 1
        }
      ],
      "rRange": [
        0,
        16
      ],
      "xAxis": "bottom",
      "xLabelAnchor": "center",
      "yAxis": "right",
      "yLabelAnchor": "center",
      "margins": {
        "top": 5,
        "bottom": 30,
        "left": 5,
        "right": 50
      },
      "width": 700,
      "height": 480
    }
  ]
};
