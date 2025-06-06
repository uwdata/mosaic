import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Symbol Plots",
    "description": "Two scatter plots with `dot` marks: one with stroked symbols, the other filled. Drop-down menus control which data table columns are plotted.\n"
  },
  "data": {
    "penguins": {
      "file": "data/penguins.parquet"
    }
  },
  "params": {
    "x": "body_mass",
    "y": "flipper_length"
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "input": "menu",
          "label": "Y",
          "options": [
            "body_mass",
            "flipper_length",
            "bill_depth",
            "bill_length"
          ],
          "as": "$y"
        },
        {
          "input": "menu",
          "label": "X",
          "options": [
            "body_mass",
            "flipper_length",
            "bill_depth",
            "bill_length"
          ],
          "as": "$x"
        }
      ]
    },
    {
      "vspace": 10
    },
    {
      "hconcat": [
        {
          "name": "stroked",
          "plot": [
            {
              "mark": "dot",
              "data": {
                "from": "penguins"
              },
              "x": {
                "column": "$x"
              },
              "y": {
                "column": "$y"
              },
              "stroke": "species",
              "symbol": "species"
            }
          ],
          "grid": true,
          "xLabel": "Body mass (g) →",
          "yLabel": "↑ Flipper length (mm)"
        },
        {
          "legend": "symbol",
          "for": "stroked",
          "columns": 1
        }
      ]
    },
    {
      "vspace": 20
    },
    {
      "hconcat": [
        {
          "name": "filled",
          "plot": [
            {
              "mark": "dot",
              "data": {
                "from": "penguins"
              },
              "x": {
                "column": "$x"
              },
              "y": {
                "column": "$y"
              },
              "fill": "species",
              "symbol": "species"
            }
          ],
          "grid": true,
          "xLabel": "Body mass (g) →",
          "yLabel": "↑ Flipper length (mm)"
        },
        {
          "legend": "symbol",
          "for": "filled",
          "columns": 1
        }
      ]
    }
  ]
};
