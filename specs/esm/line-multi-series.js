import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("bls_unemp", "data/bls-metro-unemployment.parquet")
]);

const $curr = vg.Selection.intersect();

export default vg.plot(
  vg.ruleY([0]),
  vg.lineY(
    vg.from("bls_unemp", {optimize: false}),
    {
      x: "date",
      y: "unemployment",
      z: "division",
      stroke: "steelblue",
      strokeOpacity: 0.9,
      curve: "monotone-x"
    }
  ),
  vg.nearestX({channels: ["z"], as: $curr}),
  vg.highlight({by: $curr}),
  vg.dot(
    vg.from("bls_unemp"),
    {
      x: "date",
      y: "unemployment",
      z: "division",
      r: 2,
      fill: "currentColor",
      select: "nearestX"
    }
  ),
  vg.text(
    vg.from("bls_unemp"),
    {
      x: "date",
      y: "unemployment",
      text: "division",
      fill: "currentColor",
      dy: -8,
      select: "nearestX"
    }
  ),
  vg.marginLeft(24),
  vg.xLabel(null),
  vg.xTicks(10),
  vg.yLabel("Unemployment (%)"),
  vg.yGrid(true),
  vg.style("overflow: visible;"),
  vg.width(680)
);