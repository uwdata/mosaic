import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("latency", "https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/data/observable-latency.parquet")
]);

const $filter = vg.Selection.crossfilter();
const $highlight = vg.Selection.intersect();

export default vg.vconcat(
  vg.plot(
    vg.frame({fill: "black"}),
    vg.raster(
      vg.from("latency", {filterBy: $filter}),
      {
        x: "time",
        y: "latency",
        fill: vg.argmax("route", "count"),
        fillOpacity: vg.sum("count"),
        width: 2016,
        height: 500,
        imageRendering: "pixelated"
      }
    ),
    vg.intervalXY({as: $filter}),
    vg.colorDomain(vg.Fixed),
    vg.colorScheme("observable10"),
    vg.opacityDomain([0, 25]),
    vg.opacityClamp(true),
    vg.yScale("log"),
    vg.yLabel("↑ Duration (ms)"),
    vg.yDomain([0.5, 10000]),
    vg.yTickFormat("s"),
    vg.xScale("utc"),
    vg.xLabel(null),
    vg.xDomain([1706227200000, 1706832000000]),
    vg.width(680),
    vg.height(300),
    vg.margins({left: 35, top: 20, bottom: 30, right: 20})
  ),
  vg.plot(
    vg.barX(
      vg.from("latency", {filterBy: $filter}),
      {
        x: vg.sum("count"),
        y: "route",
        fill: "route",
        sort: {y: "-x", limit: 15}
      }
    ),
    vg.toggleY({as: $filter}),
    vg.toggleY({as: $highlight}),
    vg.highlight({by: $highlight}),
    vg.colorDomain(vg.Fixed),
    vg.xLabel("Routes by Total Requests"),
    vg.xTickFormat("s"),
    vg.yLabel(null),
    vg.width(680),
    vg.height(300),
    vg.marginTop(5),
    vg.marginLeft(220),
    vg.marginBottom(35)
  )
);