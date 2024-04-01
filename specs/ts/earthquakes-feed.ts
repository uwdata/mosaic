import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Earthquakes Feed",
    "description": "Earthquake data from the USGS live feed. To show land masses, this example loads and parses TopoJSON data in the database. Requires the DuckDB `spatial` extension.\n",
    "credit": "Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-live-earthquake-map)."
  },
  "data": {
    "feed": {
      "type": "spatial",
      "file": "data/usgs-feed.geojson"
    },
    "world": {
      "type": "spatial",
      "file": "data/countries-110m.json",
      "layer": "land"
    }
  },
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
      "r": {
        "sql": "POW(10, mag)"
      },
      "stroke": "red",
      "fill": "red",
      "fillOpacity": 0.2,
      "title": "title",
      "href": "url",
      "target": "_blank"
    }
  ],
  "margin": 2,
  "projectionType": "equirectangular"
};
