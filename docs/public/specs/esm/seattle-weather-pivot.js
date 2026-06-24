import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("seattle_weather", "data/seattle-weather.parquet"),
  `CREATE TABLE IF NOT EXISTS "weatherByYear" AS PIVOT (SELECT *, year(date) AS year FROM seattle_weather) ON weather IN ('drizzle', 'fog', 'rain', 'snow', 'sun') USING count(*) GROUP BY year ORDER BY year`
]);

export default vg.table({from: "weatherByYear", align: {year: "left"}, width: {year: 80}, height: 180});