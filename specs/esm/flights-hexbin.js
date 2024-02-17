import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("flights", "data/flights-200k.parquet")
]);

const $scale = vg.Param.value("log");
const $query = vg.Selection.intersect();

export default vg.vconcat(
  vg.hconcat(
    vg.menu({label: "Color Scale", as: $scale, options: ["log", "linear", "sqrt"]}),
    vg.hspace(10),
    vg.colorLegend({for: "hexbins"})
  ),
  vg.hconcat(
    vg.plot(
      vg.rectY(
        vg.from("flights"),
        {x: vg.bin("time"), y: vg.count(), fill: "steelblue", inset: 0.5}
      ),
      vg.intervalX({as: $query}),
      vg.margins({left: 5, right: 5, top: 30, bottom: 0}),
      vg.xDomain(vg.Fixed),
      vg.xAxis("top"),
      vg.yAxis(null),
      vg.xLabelAnchor("center"),
      vg.width(605),
      vg.height(70)
    ),
    vg.hspace(80)
  ),
  vg.hconcat(
    vg.plot(
      vg.hexbin(
        vg.from("flights", {filterBy: $query}),
        {x: "time", y: "delay", fill: vg.count(), binWidth: 10}
      ),
      vg.hexgrid({binWidth: 10}),
      vg.name("hexbins"),
      vg.colorScheme("ylgnbu"),
      vg.colorScale($scale),
      vg.margins({left: 5, right: 0, top: 0, bottom: 5}),
      vg.xAxis(null),
      vg.yAxis(null),
      vg.xyDomain(vg.Fixed),
      vg.width(600),
      vg.height(455)
    ),
    vg.plot(
      vg.rectX(
        vg.from("flights"),
        {x: vg.count(), y: vg.bin("delay"), fill: "steelblue", inset: 0.5}
      ),
      vg.intervalY({as: $query}),
      vg.margins({left: 0, right: 50, top: 4, bottom: 5}),
      vg.yDomain([-60, 180]),
      vg.xAxis(null),
      vg.yAxis("right"),
      vg.yLabelAnchor("center"),
      vg.width(80),
      vg.height(455)
    )
  )
);