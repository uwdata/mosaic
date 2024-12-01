import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("penguins", "data/penguins.parquet")
]);

const $bandwidth = vg.Param.value(20);
const $normalize = vg.Param.value("none");
const $stack = vg.Param.value(false);
const $offset = vg.Param.value(null);

export default vg.vconcat(
  vg.hconcat(
    vg.menu({label: "Normalize", as: $normalize, options: ["none", "sum", "max"]}),
    vg.menu({label: "Stack", as: $stack, options: [false, true]}),
    vg.menu({
      label: "Offset",
      as: $offset,
      options: [
      {label: "none", value: null},
      {label: "normalize", value: "normalize"},
      {label: "center", value: "center"}
    ]
    })
  ),
  vg.plot(
    vg.densityY(
      vg.from("penguins"),
      {
        x: "bill_depth",
        fill: "species",
        fillOpacity: 0.4,
        bandwidth: $bandwidth,
        normalize: $normalize,
        stack: $stack,
        offset: $offset
      }
    ),
    vg.marginLeft(50),
    vg.height(200)
  )
);