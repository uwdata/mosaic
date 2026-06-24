import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Seattle Weather Pivot",
    "description": "A DuckDB `PIVOT` query reshapes Seattle's daily weather observations into a cross-tab: one row per year, with a column counting the days of each weather type. The pivoted result is shown in a sortable `table` view. Click a column header to sort.\n"
  },
  "data": {
    "seattle_weather": {
      "file": "data/seattle-weather.parquet"
    },
    "weatherByYear": "PIVOT (SELECT *, year(date) AS year FROM seattle_weather) ON weather IN ('drizzle', 'fog', 'rain', 'snow', 'sun') USING count(*) GROUP BY year ORDER BY year\n"
  },
  "input": "table",
  "from": "weatherByYear",
  "align": {
    "year": "left"
  },
  "width": {
    "year": 80
  },
  "height": 180
};
