import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("walk", "data/random-walk.parquet")
]);

const $brush = vg.Selection.intersect();

export default vg.vconcat(
  vg.plot(
    vg.areaY(
      vg.from("walk"),
      {x: "t", y: "v", fill: "steelblue"}
    ),
    vg.intervalX({as: $brush}),
    vg.width(680),
    vg.height(200)
  ),
  vg.plot(
    vg.areaY(
      vg.from("walk", {filterBy: $brush}),
      {x: "t", y: "v", fill: "steelblue"}
    ),
    vg.yDomain(vg.Fixed),
    vg.width(680),
    vg.height(200)
  )
);