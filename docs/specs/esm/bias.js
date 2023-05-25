import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadParquet("walk", "data/random-walk.parquet")
);

const $point = vg.Param.value(0);

export default vg.vconcat(
  vg.slider({ label: "Bias", as: $point, min: 1, max: 1000, step: 0.1 }),
  vg.plot(
    vg.areaY(
      vg.from("walk"),
      { x: "t", y: vg.sql`v + ${$point}`, fill: "steelblue" }
    ),
    vg.width(680),
    vg.height(200)
  )
);