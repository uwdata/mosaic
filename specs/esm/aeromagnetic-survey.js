import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("ca55", "data/ca55-south.parquet")
]);

const $interp = vg.Param.value("random-walk");
const $blur = vg.Param.value(0);

export default vg.vconcat(
  vg.hconcat(
    vg.menu({
      label: "Interpolation Method",
      options: ["none", "nearest", "barycentric", "random-walk"],
      as: $interp
    }),
    vg.hspace("1em"),
    vg.slider({label: "Blur", min: 0, max: 100, as: $blur})
  ),
  vg.vspace("1em"),
  vg.plot(
    vg.raster(
      vg.from("ca55"),
      {
        x: "LONGITUDE",
        y: "LATITUDE",
        fill: vg.max("MAG_IGRF90"),
        interpolate: $interp,
        bandwidth: $blur
      }
    ),
    vg.colorScale("diverging"),
    vg.colorDomain(vg.Fixed)
  )
);