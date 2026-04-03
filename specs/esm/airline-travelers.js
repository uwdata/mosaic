import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("travelers", "data/travelers.parquet"),
  `CREATE TABLE IF NOT EXISTS endpoint AS SELECT * FROM travelers ORDER BY date DESC LIMIT 1`
]);

export default vg.plot(
  vg.ruleY([0]),
  vg.lineY(
    vg.from("travelers"),
    {x: "date", y: "previous", strokeOpacity: 0.35}
  ),
  vg.lineY(
    vg.from("travelers"),
    {x: "date", y: "current"}
  ),
  vg.text(
    vg.from("endpoint"),
    {
      x: "date",
      y: "previous",
      text: ["2019"],
      fillOpacity: 0.5,
      lineAnchor: "bottom",
      dy: -6
    }
  ),
  vg.text(
    vg.from("endpoint"),
    {x: "date", y: "current", text: ["2020"], lineAnchor: "top", dy: 6}
  ),
  vg.yGrid(true),
  vg.yLabel("↑ Travelers per day"),
  vg.yTickFormat("s")
);