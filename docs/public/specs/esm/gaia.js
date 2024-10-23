import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  `CREATE TABLE IF NOT EXISTS gaia AS -- compute u and v with natural earth projection
WITH prep AS (
  SELECT
    radians((-l + 540) % 360 - 180) AS lambda,
    radians(b) AS phi,
    asin(sqrt(3)/2 * sin(phi)) AS t,
    t^2 AS t2,
    t2^3 AS t6,
    *
  FROM 'https://idl.uw.edu/mosaic-datasets/data/gaia-5m.parquet'
  WHERE parallax BETWEEN -5 AND 20 AND phot_g_mean_mag IS NOT NULL AND bp_rp IS NOT NULL
)
SELECT
  (1.340264 * lambda * cos(t)) / (sqrt(3)/2 * (1.340264 + (-0.081106 * 3 * t2) + (t6 * (0.000893 * 7 + 0.003796 * 9 * t2)))) AS u,
  t * (1.340264 + (-0.081106 * t2) + (t6 * (0.000893 + 0.003796 * t2))) AS v,
  * EXCLUDE('t', 't2', 't6')
FROM prep`
]);

const $brush = vg.Selection.crossfilter();
const $bandwidth = vg.Param.value(0);
const $pixelSize = vg.Param.value(2);
const $scaleType = vg.Param.value("sqrt");

export default vg.hconcat(
  vg.vconcat(
    vg.plot(
      vg.raster(
        vg.from("gaia", {filterBy: $brush}),
        {
          x: "u",
          y: "v",
          fill: "density",
          bandwidth: $bandwidth,
          pixelSize: $pixelSize
        }
      ),
      vg.intervalXY({pixelSize: 2, as: $brush}),
      vg.xyDomain(vg.Fixed),
      vg.colorScale($scaleType),
      vg.colorScheme("viridis"),
      vg.width(440),
      vg.height(250),
      vg.marginLeft(25),
      vg.marginTop(20),
      vg.marginRight(1)
    ),
    vg.hconcat(
      vg.plot(
        vg.rectY(
          vg.from("gaia", {filterBy: $brush}),
          {
            x: vg.bin("phot_g_mean_mag"),
            y: vg.count(),
            fill: "steelblue",
            inset: 0.5
          }
        ),
        vg.intervalX({as: $brush}),
        vg.xDomain(vg.Fixed),
        vg.yScale($scaleType),
        vg.yGrid(true),
        vg.width(220),
        vg.height(120),
        vg.marginLeft(65)
      ),
      vg.plot(
        vg.rectY(
          vg.from("gaia", {filterBy: $brush}),
          {x: vg.bin("parallax"), y: vg.count(), fill: "steelblue", inset: 0.5}
        ),
        vg.intervalX({as: $brush}),
        vg.xDomain(vg.Fixed),
        vg.yScale($scaleType),
        vg.yGrid(true),
        vg.width(220),
        vg.height(120),
        vg.marginLeft(65)
      )
    )
  ),
  vg.hspace(10),
  vg.plot(
    vg.raster(
      vg.from("gaia", {filterBy: $brush}),
      {
        x: "bp_rp",
        y: "phot_g_mean_mag",
        fill: "density",
        bandwidth: $bandwidth,
        pixelSize: $pixelSize
      }
    ),
    vg.intervalXY({pixelSize: 2, as: $brush}),
    vg.xyDomain(vg.Fixed),
    vg.colorScale($scaleType),
    vg.colorScheme("viridis"),
    vg.yReverse(true),
    vg.width(230),
    vg.height(370),
    vg.marginLeft(25),
    vg.marginTop(20),
    vg.marginRight(1)
  )
);