import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("weather", "data/seattle-weather.parquet")
]);

export default vg.plot(
  vg.areaY(
    vg.from("weather"),
    {
      x: vg.dateMonth("date"),
      y1: vg.max("temp_max"),
      y2: vg.min("temp_min"),
      fill: "#ccc",
      fillOpacity: 0.25,
      curve: "monotone-x"
    }
  ),
  vg.areaY(
    vg.from("weather"),
    {
      x: vg.dateMonth("date"),
      y1: vg.avg("temp_max"),
      y2: vg.avg("temp_min"),
      fill: "steelblue",
      fillOpacity: 0.75,
      curve: "monotone-x"
    }
  ),
  vg.ruleY(
    [15],
    {strokeOpacity: 0.5, strokeDasharray: "5 5"}
  ),
  vg.xTickFormat("%b"),
  vg.yLabel("Temperature Range (°C)"),
  vg.width(680),
  vg.height(300)
);