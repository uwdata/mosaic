import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("cases", "data/berlin-covid.parquet")
]);

const $frame = vg.Param.array([-6, 0]);

export default vg.vconcat(
  vg.plot(
    vg.rectY(
      vg.from("cases"),
      {x1: "day", x2: vg.sql`day + 1`, inset: 1, y: "cases", fill: "steelblue"}
    ),
    vg.lineY(
      vg.from("cases"),
      {
        x: vg.sql`day + 0.5`,
        y: vg.avg("cases").orderby("day").rows($frame),
        curve: "monotone-x",
        stroke: "currentColor"
      }
    ),
    vg.xLabel("day"),
    vg.width(680),
    vg.height(300)
  ),
  vg.menu({
    label: "Window Frame",
    as: $frame,
    options: [
    {label: "7-day moving average, with prior 6 days: [-6, 0]", value: [-6, 0]},
    {
    label: "7-day moving average, centered at current day: [-3, 3]",
    value: [-3, 3]
  },
    {label: "Moving average, with all prior days [-∞, 0]", value: [null, 0]},
    {label: "Global average [-∞, +∞]", value: [null, null]}
  ]
  })
);