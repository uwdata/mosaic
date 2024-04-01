import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "U.S. Unemployment",
    "description": "A choropleth map of unemployment rates for U.S. counties. Requires the DuckDB `spatial` extension.\n",
    "credit": "Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-us-choropleth)."
  },
  "data": {
    "counties": {
      "type": "spatial",
      "file": "data/us-counties-10m.json",
      "layer": "counties"
    },
    "rates": {
      "file": "data/us-county-unemployment.parquet"
    },
    "combined": "SELECT a.geom AS geom, b.rate AS rate FROM counties AS a, rates AS b WHERE a.id = b.id\n"
  },
  "vconcat": [
    {
      "legend": "color",
      "for": "county-map",
      "label": "Unemployment (%)"
    },
    {
      "name": "county-map",
      "plot": [
        {
          "mark": "geo",
          "data": {
            "from": "combined"
          },
          "fill": "rate",
          "title": {
            "sql": "concat(rate, '%')"
          }
        }
      ],
      "margin": 0,
      "colorScale": "quantile",
      "colorN": 9,
      "colorScheme": "blues",
      "projectionType": "albers-usa"
    }
  ]
};
