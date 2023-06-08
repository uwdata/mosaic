import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadParquet("metros", "data/metros.parquet")
);

const $bend = vg.Param.value(true);

export default vg.vconcat(
  vg.colorLegend({ for: "arrows", label: "Change in inequality from 1980 to 2015" }),
  vg.plot(
    vg.arrow(
      vg.from("metros"),
      { x1: "POP_1980", y1: "R90_10_1980", x2: "POP_2015", y2: "R90_10_2015", bend: $bend, stroke: vg.sql`R90_10_2015 - R90_10_1980` }
    ),
    vg.text(
      vg.from("metros"),
      { x: "POP_2015", y: "R90_10_2015", filter: "highlight", text: "nyt_display", fill: "currentColor", dy: -6 }
    ),
    vg.name("arrows"),
    vg.grid(true),
    vg.inset(10),
    vg.xScale("log"),
    vg.xLabel("Population →"),
    vg.yLabel("↑ Inequality"),
    vg.yTicks(4),
    vg.colorScheme("BuRd"),
    vg.colorTickFormat("+f")
  ),
  vg.menu({ label: "Bend Arrows?", options: [true,false], as: $bend })
);