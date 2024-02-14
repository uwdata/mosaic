import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("driving", "data/driving.parquet")
]);

export default vg.plot(
  vg.line(
    vg.from("driving"),
    {x: "miles", y: "gas", curve: "catmull-rom", marker: true}
  ),
  vg.text(
    vg.from("driving"),
    {
      x: "miles",
      y: "gas",
      text: vg.sql`year::VARCHAR`,
      dy: -6,
      lineAnchor: "bottom",
      filter: vg.sql`year % 5 = 0`
    }
  ),
  vg.inset(10),
  vg.grid(true),
  vg.xLabel("Miles driven (per person-year)"),
  vg.yLabel("Cost of gasoline ($ per gallon)")
);