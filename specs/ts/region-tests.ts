import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Region Interactor Tests",
    "descriptions": "Varied plots using region interactors to highlight selected values.\n"
  },
  "data": {
    "bls_unemp": {
      "file": "data/bls-metro-unemployment.parquet"
    },
    "feed": {
      "type": "spatial",
      "file": "data/usgs-feed.geojson"
    },
    "world": {
      "type": "spatial",
      "file": "data/countries-110m.json",
      "layer": "land"
    },
    "counties": {
      "type": "spatial",
      "file": "data/us-counties-10m.json",
      "layer": "counties"
    }
  },
  "params": {
    "series": {
      "select": "single"
    },
    "quakes": {
      "select": "single"
    },
    "counties": {
      "select": "single"
    }
  },
  "vconcat": [
    {
      "plot": [
        {
          "mark": "ruleY",
          "data": [
            0
          ]
        },
        {
          "mark": "lineY",
          "data": {
            "from": "bls_unemp",
            "optimize": false
          },
          "x": "date",
          "y": "unemployment",
          "z": "division",
          "stroke": "steelblue",
          "strokeOpacity": 0.9,
          "curve": "monotone-x"
        },
        {
          "select": "region",
          "channels": [
            "z"
          ],
          "as": "$series"
        },
        {
          "select": "highlight",
          "by": "$series"
        }
      ],
      "marginLeft": 24,
      "xLabel": null,
      "xTicks": 10,
      "yLabel": "Unemployment (%)",
      "yGrid": true,
      "marginRight": 0
    },
    {
      "vspace": 10
    },
    {
      "plot": [
        {
          "mark": "geo",
          "data": {
            "from": "world"
          },
          "fill": "currentColor",
          "fillOpacity": 0.2
        },
        {
          "mark": "sphere",
          "strokeWidth": 0.5
        },
        {
          "mark": "geo",
          "data": {
            "from": "feed"
          },
          "channels": {
            "id": "id"
          },
          "r": {
            "sql": "POW(10, mag)"
          },
          "stroke": "red",
          "fill": "red",
          "fillOpacity": 0.2,
          "title": "title",
          "href": "url",
          "target": "_blank"
        },
        {
          "select": "region",
          "channels": [
            "id"
          ],
          "as": "$quakes"
        },
        {
          "select": "highlight",
          "by": "$quakes"
        }
      ],
      "margin": 2,
      "projectionType": "equirectangular"
    },
    {
      "vspace": 10
    },
    {
      "plot": [
        {
          "mark": "geo",
          "data": {
            "from": "counties"
          },
          "channels": {
            "id": "id"
          },
          "stroke": "currentColor",
          "strokeWidth": 0.25
        },
        {
          "select": "region",
          "channels": [
            "id"
          ],
          "as": "$counties"
        },
        {
          "select": "highlight",
          "by": "$counties"
        }
      ],
      "margin": 0,
      "projectionType": "albers"
    }
  ]
};
