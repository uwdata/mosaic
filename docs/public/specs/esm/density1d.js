import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadParquet("flights", "data/flights-200k.parquet")
);

const $brush = vg.Selection.crossfilter();
const $bandwidth = vg.Param.value(10);

export default vg.vconcat(
  vg.slider({ label: "Bandwidth (σ)", as: $bandwidth, min: 0.1, max: 100, step: 0.1 }),
  vg.plot(
    vg.densityY(
      vg.from("flights", { filterBy: $brush }),
      { x: "delay", fill: "#ccc", bandwidth: $bandwidth }
    ),
    vg.intervalX({ as: $brush }),
    vg.yAxis(null),
    vg.xDomain(vg.Fixed),
    vg.width(600),
    vg.marginLeft(10),
    vg.height(200)
  ),
  vg.plot(
    vg.densityY(
      vg.from("flights", { filterBy: $brush }),
      { x: "distance", fill: "#ccc", bandwidth: $bandwidth }
    ),
    vg.intervalX({ as: $brush }),
    vg.yAxis(null),
    vg.xDomain(vg.Fixed),
    vg.width(600),
    vg.marginLeft(10),
    vg.height(200)
  )
);