import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("aapl", "data/stocks.parquet", {where: "Symbol = 'AAPL'"})
]);

export default vg.plot(
  vg.lineY(
    vg.from("aapl"),
    {stroke: "#ccc", x: "Date", y: "Close"}
  ),
  vg.lineY(
    vg.from("aapl"),
    {
      stroke: "black",
      x: "Date",
      y: vg.avg("Close").orderby("Date").frame(vg.frameRange([vg.days(15), vg.days(15)]))
    }
  ),
  vg.lineY(
    vg.from("aapl"),
    {
      stroke: "firebrick",
      x: "Date",
      y: vg.avg("Close").orderby("Date").frame(vg.frameRange([vg.months(3), vg.months(3)]))
    }
  ),
  vg.yLabel("Close"),
  vg.width(680),
  vg.height(200)
);