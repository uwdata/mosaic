import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadCSV("weather", "data/seattle-weather.csv")
);

export default vg.plot(
  vg.areaY(
    vg.from("weather"),
    { x: vg.dateMonth("date"), y1: vg.avg("temp_max"), y2: vg.avg("temp_min"), fill: "steelblue", fillOpacity: 0.5, curve: "monotone-x" }
  ),
  vg.ruleY(
    [15],
    { strokeOpacity: 0.5, strokeDasharray: [5,5] }
  ),
  vg.xTickFormat("%b"),
  vg.yZero(true),
  vg.yLabel("Average Temperature Range (°C)"),
  vg.width(680),
  vg.height(300)
);