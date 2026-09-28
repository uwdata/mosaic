import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("seattle_2015", "data/seattle-weather.parquet", {where: "date >= DATE '2015-01-01' AND date < DATE '2016-01-01'"})
]);

export default vg.vconcat(
  vg.plot(
    vg.barY(
      vg.from("seattle_2015"),
      {x: vg.dateMonth("date"), y: vg.sum("precipitation"), fill: "steelblue"}
    ),
    vg.xScale("band"),
    vg.xTickFormat("%b"),
    vg.xLabel(null),
    vg.yLabel("Monthly precipitation (mm)"),
    vg.yGrid(true),
    vg.width(680),
    vg.height(200)
  ),
  vg.plot(
    vg.lineY(
      vg.from("seattle_2015"),
      {
        x: vg.dateMonth("date"),
        y: vg.sum(vg.sum("precipitation")).orderby(vg.dateMonth("date")),
        stroke: "steelblue",
        marker: "circle"
      }
    ),
    vg.xTickFormat("%b"),
    vg.xLabel(null),
    vg.yLabel("Cumulative precipitation (mm)"),
    vg.yGrid(true),
    vg.yZero(true),
    vg.width(680),
    vg.height(240)
  )
);