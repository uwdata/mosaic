import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  `CREATE TEMP TABLE IF NOT EXISTS flights10m AS SELECT GREATEST(-60, LEAST(ARR_DELAY, 180))::DOUBLE AS delay, DISTANCE AS distance, DEP_TIME AS time FROM 'https://uwdata.github.io/mosaic-datasets/data/flights-10m.parquet'`
]);

const $query = vg.Selection.intersect();

export default vg.plot(
  vg.raster(
    vg.from("flights10m"),
    {x: "time", y: "delay", pixelSize: 4, pad: 0, imageRendering: "pixelated"}
  ),
  vg.regressionY(
    vg.from("flights10m"),
    {x: "time", y: "delay", stroke: "gray"}
  ),
  vg.regressionY(
    vg.from("flights10m", {filterBy: $query}),
    {x: "time", y: "delay", stroke: "firebrick"}
  ),
  vg.intervalXY({as: $query, brush: {fillOpacity: 0, stroke: "currentColor"}}),
  vg.xDomain([0, 24]),
  vg.yDomain([-60, 180]),
  vg.colorScale("symlog"),
  vg.colorScheme("blues")
);