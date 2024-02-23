import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("flights", "data/flights-200k.parquet")
]);

const $bandwidth = vg.Param.value(7);
const $thresholds = vg.Param.value(10);

export default vg.vconcat(
  vg.hconcat(
    vg.slider({label: "Bandwidth (σ)", as: $bandwidth, min: 1, max: 100}),
    vg.slider({label: "Thresholds", as: $thresholds, min: 2, max: 20})
  ),
  vg.plot(
    vg.heatmap(
      vg.from("flights"),
      {x: "time", y: "delay", fill: "density", bandwidth: $bandwidth}
    ),
    vg.contour(
      vg.from("flights"),
      {
        x: "time",
        y: "delay",
        stroke: "white",
        strokeOpacity: 0.5,
        bandwidth: $bandwidth,
        thresholds: $thresholds
      }
    ),
    vg.colorScale("symlog"),
    vg.colorScheme("ylgnbu"),
    vg.xAxis("top"),
    vg.xLabelAnchor("center"),
    vg.xZero(true),
    vg.yAxis("right"),
    vg.yLabelAnchor("center"),
    vg.marginTop(30),
    vg.marginLeft(5),
    vg.marginRight(40),
    vg.width(700),
    vg.height(500)
  )
);