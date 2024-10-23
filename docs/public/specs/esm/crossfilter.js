import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("flights", "data/flights-200k.parquet")
]);

const $brush = vg.Selection.crossfilter();

export default vg.vconcat(
  vg.plot(
    vg.rectY(
      vg.from("flights", {filterBy: $brush}),
      {
        x: vg.bin("delay"),
        y: vg.count(),
        fill: "steelblue",
        insetLeft: 0.5,
        insetRight: 0.5
      }
    ),
    vg.intervalX({as: $brush}),
    vg.xDomain(vg.Fixed),
    vg.xLabel("Arrival Delay (min)"),
    vg.xLabelAnchor("center"),
    vg.yTickFormat("s"),
    vg.height(200)
  ),
  vg.plot(
    vg.rectY(
      vg.from("flights", {filterBy: $brush}),
      {
        x: vg.bin("time"),
        y: vg.count(),
        fill: "steelblue",
        insetLeft: 0.5,
        insetRight: 0.5
      }
    ),
    vg.intervalX({as: $brush}),
    vg.xDomain(vg.Fixed),
    vg.xLabel("Departure Time (hour)"),
    vg.xLabelAnchor("center"),
    vg.yTickFormat("s"),
    vg.height(200)
  )
);