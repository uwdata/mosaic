import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadCSV("penguins", "data/penguins.csv")
);

const $bandwidth = vg.Param.value(40);
const $bins = vg.Param.value(10);

export default vg.vconcat(
  vg.hconcat(
    vg.slider({ label: "Bandwidth (σ)", as: $bandwidth, min: 1, max: 100 }),
    vg.slider({ label: "Bins", as: $bins, min: 3, max: 40 })
  ),
  vg.plot(
    vg.density(
      vg.from("penguins"),
      { x: "bill_length", y: "bill_depth", r: "density", fill: "#ddd", binsX: $bins, binsY: $bins, bandwidth: $bandwidth }
    ),
    vg.dot(
      vg.from("penguins"),
      { x: "bill_length", y: "bill_depth", fill: "black", r: 1 }
    ),
    vg.rRange([0,16]),
    vg.xAxis("bottom"),
    vg.xLabelAnchor("center"),
    vg.yAxis("right"),
    vg.yLabelAnchor("center"),
    vg.margins({"top":5,"bottom":30,"left":5,"right":50}),
    vg.width(700),
    vg.height(480)
  )
);