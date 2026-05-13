import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadCSV("wave", "data/m4-area-sine.csv")
]);

const $brush = vg.Selection.intersect();

export default vg.vconcat(
  vg.plot(
    vg.areaY(
      vg.from("wave", {filterBy: $brush}),
      {x: "time_stamp", y: "power"}
    ),
    vg.yDomain(vg.Fixed),
    vg.colorDomain(vg.Fixed),
    vg.xLabel(null),
    vg.width(680),
    vg.height(180)
  ),
  vg.vspace(5),
  vg.plot(
    vg.areaY(
      vg.from("wave", {filterBy: $brush, optimize: false}),
      {x: "time_stamp", y: "power"}
    ),
    vg.yDomain(vg.Fixed),
    vg.colorDomain(vg.Fixed),
    vg.xLabel(null),
    vg.width(680),
    vg.height(180)
  ),
  vg.vspace(10),
  vg.plot(
    vg.areaY(
      vg.from("wave", {optimize: false}),
      {x: "time_stamp", y: "power"}
    ),
    vg.intervalX({as: $brush}),
    vg.yDomain(vg.Fixed),
    vg.width(680),
    vg.height(90)
  )
);