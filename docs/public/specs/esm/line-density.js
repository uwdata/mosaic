import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  `CREATE TEMP TABLE IF NOT EXISTS stocks_after_2006 AS SELECT Symbol, Close, Date FROM read_csv_auto('https://uwdata.github.io/mosaic-datasets/data/stocks_after_2006.csv', SAMPLE_SIZE=-1) WHERE CLOSE < 100`
);

const $brush = vg.Selection.intersect();
const $bandwidth = vg.Param.value(0);
const $binWidth = vg.Param.value(1);
const $schemeColor = vg.Param.value("pubugn");
const $scaleColor = vg.Param.value("sqrt");

export default vg.vconcat(
  vg.hconcat(
    vg.slider({ label: "Bandwidth (σ)", as: $bandwidth, min: 0, max: 10, step: 0.1 }),
    vg.menu({ label: "Bin Width", as: $binWidth, options: [0.5,1,2] })
  ),
  vg.vspace(10),
  vg.plot(
    vg.denseLine(
      vg.from("stocks_after_2006", { filterBy: $brush }),
      { x: "Date", y: "Close", z: "Symbol", fill: "density", bandwidth: $bandwidth, binWidth: $binWidth }
    ),
    vg.colorScheme($schemeColor),
    vg.colorScale($scaleColor),
    vg.yLabel("Close (Normalized) ↑"),
    vg.yNice(true),
    vg.margins({"left":30,"top":20,"right":0}),
    vg.width(680),
    vg.height(240)
  ),
  vg.plot(
    vg.denseLine(
      vg.from("stocks_after_2006"),
      { x: "Date", y: "Close", z: "Symbol", fill: "density", normalize: false, bandwidth: $bandwidth, binWidth: $binWidth }
    ),
    vg.intervalXY({ as: $brush }),
    vg.colorScheme($schemeColor),
    vg.colorScale($scaleColor),
    vg.yLabel("Close (Unnormalized) ↑"),
    vg.yNice(true),
    vg.margins({"left":30,"top":20,"right":0}),
    vg.width(680),
    vg.height(240)
  )
);