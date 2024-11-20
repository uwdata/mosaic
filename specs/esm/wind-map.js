import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("wind", "data/wind.parquet", {select: ["*", "row_number() over () as id"]})
]);

const $selected = vg.Selection.union();
const $length = vg.Param.value(2);

export default vg.vconcat(
  vg.colorLegend({for: "wind-map", label: "Speed (m/s)", as: $selected}),
  vg.plot(
    vg.vector(
      vg.from("wind"),
      {
        x: "longitude",
        y: "latitude",
        rotate: vg.sql`degrees(atan2(u, v))`,
        length: vg.sql`${$length} * sqrt(u * u + v * v)`,
        stroke: vg.sql`sqrt(u * u + v * v)`,
        channels: {id: "id"}
      }
    ),
    vg.region({as: $selected, channels: ["id"]}),
    vg.highlight({by: $selected}),
    vg.name("wind-map"),
    vg.lengthScale("identity"),
    vg.colorZero(true),
    vg.inset(10),
    vg.aspectRatio(1),
    vg.width(680)
  ),
  vg.slider({min: 1, max: 7, step: 0.1, as: $length, label: "Vector Length"})
);