import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Layered Globes",
    "description": "Two globes layered on top of one another with `zconcat`, each rotated by its own pair of sliders, to compare the size and shape of distant landmasses (blue starts on Africa, red on Australia). The sliders sit outside the `zconcat`, so they stay usable while the globes overlap. Requires the DuckDB `spatial` extension.\n"
  },
  "data": {
    "land": {
      "type": "spatial",
      "file": "data/countries-110m.json",
      "layer": "land"
    }
  },
  "params": {
    "blueLongitude": -20,
    "blueLatitude": -5,
    "blueRotate": [
      "$blueLongitude",
      "$blueLatitude"
    ],
    "redLongitude": -134,
    "redLatitude": 25,
    "redRotate": [
      "$redLongitude",
      "$redLatitude"
    ]
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "input": "slider",
          "label": "Blue longitude",
          "as": "$blueLongitude",
          "min": -180,
          "max": 180,
          "step": 1
        },
        {
          "input": "slider",
          "label": "Blue latitude",
          "as": "$blueLatitude",
          "min": -90,
          "max": 90,
          "step": 1
        }
      ]
    },
    {
      "hconcat": [
        {
          "input": "slider",
          "label": "Red longitude",
          "as": "$redLongitude",
          "min": -180,
          "max": 180,
          "step": 1
        },
        {
          "input": "slider",
          "label": "Red latitude",
          "as": "$redLatitude",
          "min": -90,
          "max": 90,
          "step": 1
        }
      ]
    },
    {
      "zconcat": [
        {
          "plot": [
            {
              "mark": "geo",
              "data": {
                "from": "land"
              },
              "geometry": {
                "geojson": "geom"
              },
              "fill": "steelblue",
              "fillOpacity": 0.4
            },
            {
              "mark": "sphere",
              "stroke": "steelblue"
            }
          ],
          "width": 420,
          "height": 420,
          "margin": 10,
          "style": "overflow: visible;",
          "projectionType": "orthographic",
          "projectionRotate": "$blueRotate"
        },
        {
          "plot": [
            {
              "mark": "geo",
              "data": {
                "from": "land"
              },
              "geometry": {
                "geojson": "geom"
              },
              "fill": "tomato",
              "fillOpacity": 0.4
            },
            {
              "mark": "sphere",
              "stroke": "tomato"
            }
          ],
          "width": 420,
          "height": 420,
          "margin": 10,
          "style": "overflow: visible;",
          "projectionType": "orthographic",
          "projectionRotate": "$redRotate"
        }
      ]
    }
  ]
};
