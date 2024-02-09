import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("penguins", "data/penguins.parquet")
]);

const $bandwidth = vg.Param.value(40);
const $thresholds = vg.Param.value(10);

export default vg.vconcat(
  vg.hconcat(
    vg.slider({label: "Bandwidth (σ)", as: $bandwidth, min: 1, max: 100}),
    vg.slider({label: "Thresholds", as: $thresholds, min: 2, max: 20})
  ),
  vg.plot(
    vg.raster(
      vg.from("penguins"),
      {
        x: "bill_length",
        y: "bill_depth",
        fill: "species",
        bandwidth: $bandwidth
      }
    ),
    vg.contour(
      vg.from("penguins"),
      {
        x: "bill_length",
        y: "bill_depth",
        stroke: "species",
        bandwidth: $bandwidth,
        thresholds: $thresholds
      }
    ),
    vg.dot(
      vg.from("penguins"),
      {x: "bill_length", y: "bill_depth", fill: "black", r: 1}
    ),
    vg.xAxis("bottom"),
    vg.xLabelAnchor("center"),
    vg.yAxis("right"),
    vg.yLabelAnchor("center"),
    vg.margins({top: 5, bottom: 30, left: 5, right: 50}),
    vg.width(700),
    vg.height(480)
  )
);