import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadCSV("wave", "data/triangle-wave-day.csv")
]);

const $brush = vg.Selection.intersect();

export default vg.vconcat(
  vg.plot(
    vg.lineY(
      vg.from("wave"),
      {x: "time_stamp", y: "power", z: null, stroke: "time_stamp"}
    ),
    vg.intervalX({as: $brush}),
    vg.xLabel(null),
    vg.width(680),
    vg.height(150)
  ),
  vg.vspace(5),
  vg.plot(
    vg.lineY(
      vg.from("wave", {filterBy: $brush}),
      {x: "time_stamp", y: "power", z: null, stroke: "time_stamp"}
    ),
    vg.yDomain(vg.Fixed),
    vg.colorDomain(vg.Fixed),
    vg.xLabel(null),
    vg.width(680),
    vg.height(150)
  ),
  vg.vspace(5),
  vg.plot(
    vg.lineY(
      vg.from("wave", {filterBy: $brush, optimize: false}),
      {x: "time_stamp", y: "power", z: null, stroke: "time_stamp"}
    ),
    vg.yDomain(vg.Fixed),
    vg.colorDomain(vg.Fixed),
    vg.xLabel(null),
    vg.width(680),
    vg.height(150)
  )
);