import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  `CREATE TEMP TABLE IF NOT EXISTS flights10m AS SELECT GREATEST(-60, LEAST(ARR_DELAY, 180))::DOUBLE AS delay, DISTANCE AS distance, DEP_TIME AS time FROM 'https://uwdata.github.io/mosaic-datasets/data/flights-10m.parquet'`
);

const $brush = vg.Selection.crossfilter();

export default vg.vconcat(
  vg.plot(
    vg.rectY(
      vg.from("flights10m", { filterBy: $brush }),
      { x: vg.bin("delay"), y: vg.count(), fill: "steelblue", inset: 0.5 }
    ),
    vg.intervalX({ as: $brush }),
    vg.xDomain(vg.Fixed),
    vg.marginLeft(75),
    vg.width(600),
    vg.height(200)
  ),
  vg.plot(
    vg.rectY(
      vg.from("flights10m", { filterBy: $brush }),
      { x: vg.bin("time"), y: vg.count(), fill: "steelblue", inset: 0.5 }
    ),
    vg.intervalX({ as: $brush }),
    vg.xDomain(vg.Fixed),
    vg.marginLeft(75),
    vg.width(600),
    vg.height(200)
  ),
  vg.plot(
    vg.rectY(
      vg.from("flights10m", { filterBy: $brush }),
      { x: vg.bin("distance"), y: vg.count(), fill: "steelblue", inset: 0.5 }
    ),
    vg.intervalX({ as: $brush }),
    vg.xDomain(vg.Fixed),
    vg.marginLeft(75),
    vg.width(600),
    vg.height(200)
  )
);