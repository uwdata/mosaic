import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("stocks", "data/stocks.parquet"),
  `CREATE TABLE IF NOT EXISTS labels AS SELECT MAX(Date) as Date, ARGMAX(Close, Date) AS Close, Symbol FROM stocks GROUP BY Symbol`
]);

const $point = vg.Param.value(new Date("2013-05-13"));

export default vg.plot(
  vg.ruleX({x: $point}),
  vg.textX({x: $point, text: $point, frameAnchor: "top", lineAnchor: "bottom", dy: -7}),
  vg.text(
    vg.from("labels"),
    {
      x: "Date",
      y: vg.sql`Close / (SELECT max(Close) FROM stocks WHERE Symbol = source.Symbol AND Date = ${$point})`,
      dx: 2,
      text: "Symbol",
      fill: "Symbol",
      textAnchor: "start"
    }
  ),
  vg.lineY(
    vg.from("stocks"),
    {
      x: "Date",
      y: vg.sql`Close / (SELECT max(Close) FROM stocks WHERE Symbol = source.Symbol AND Date = ${$point})`,
      stroke: "Symbol"
    }
  ),
  vg.nearestX({as: $point}),
  vg.yScale("log"),
  vg.yDomain([0.2, 6]),
  vg.yGrid(true),
  vg.xLabel(null),
  vg.yLabel(null),
  vg.yTickFormat("%"),
  vg.width(680),
  vg.height(400),
  vg.marginRight(35)
);