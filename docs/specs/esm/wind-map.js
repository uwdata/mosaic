import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadCSV("wind", "data/wind.csv")
);

const $length = vg.Param.value(2);

export default vg.vconcat(
  vg.colorLegend({ for: "wind-map", label: "Speed (m/s)" }),
  vg.plot(
    vg.vector(
      vg.from("wind"),
      { x: "longitude", y: "latitude", rotate: vg.sql`degrees(atan2(u, v))`, length: vg.sql`${$length} * sqrt(u * u + v * v)`, stroke: vg.sql`sqrt(u * u + v * v)` }
    ),
    vg.name("wind-map"),
    vg.lengthScale("identity"),
    vg.colorZero(true),
    vg.inset(10),
    vg.aspectRatio(1),
    vg.width(680)
  ),
  vg.slider({ min: 1, max: 7, step: 0.1, as: $length, label: "Vector Length" })
);