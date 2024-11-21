import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  `CREATE TABLE IF NOT EXISTS flights10m AS SELECT GREATEST(-60, LEAST(ARR_DELAY, 180))::DOUBLE AS delay, DISTANCE AS distance, DEP_TIME AS time FROM 'https://idl.uw.edu/mosaic-datasets/data/flights-10m.parquet'`,
  `CREATE TABLE IF NOT EXISTS flights10p AS SELECT * FROM flights10m USING SAMPLE 10%`,
  `CREATE TABLE IF NOT EXISTS flights5p AS SELECT * FROM flights10m USING SAMPLE 5%`,
  `CREATE TABLE IF NOT EXISTS flights1p AS SELECT * FROM flights10m USING SAMPLE 1%`
]);

const $data = vg.Param.value("flights10m");
const $query = vg.Selection.intersect();

export default vg.vconcat(
  vg.menu({
    label: "Sample",
    as: $data,
    options: [
    {value: "flights10m", label: "Full Data"},
    {value: "flights10p", label: "10% Sample"},
    {value: "flights5p", label: "5% Sample"},
    {value: "flights1p", label: "1% Sample"}
  ]
  }),
  vg.vspace(10),
  vg.plot(
    vg.raster(
      vg.from($data),
      {x: "time", y: "delay", pixelSize: 4, pad: 0, imageRendering: "pixelated"}
    ),
    vg.regressionY(
      vg.from($data),
      {x: "time", y: "delay", stroke: "gray"}
    ),
    vg.regressionY(
      vg.from($data, {filterBy: $query}),
      {x: "time", y: "delay", stroke: "firebrick"}
    ),
    vg.intervalXY({as: $query, brush: {fillOpacity: 0, stroke: "currentColor"}}),
    vg.xDomain([0, 24]),
    vg.yDomain([-60, 180]),
    vg.colorScale("symlog"),
    vg.colorScheme("blues"),
    vg.colorDomain(vg.Fixed)
  )
);