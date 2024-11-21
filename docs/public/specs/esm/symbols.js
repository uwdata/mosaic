import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("penguins", "data/penguins.parquet")
]);

const $x = vg.Param.value("body_mass");
const $y = vg.Param.value("flipper_length");

export default vg.vconcat(
  vg.hconcat(
    vg.menu({
      label: "Y",
      options: ["body_mass", "flipper_length", "bill_depth", "bill_length"],
      as: $y
    }),
    vg.menu({
      label: "X",
      options: ["body_mass", "flipper_length", "bill_depth", "bill_length"],
      as: $x
    })
  ),
  vg.vspace(10),
  vg.hconcat(
    vg.plot(
      vg.dot(
        vg.from("penguins"),
        {
          x: vg.column($x),
          y: vg.column($y),
          stroke: "species",
          symbol: "species"
        }
      ),
      vg.name("stroked"),
      vg.grid(true),
      vg.xLabel("Body mass (g) →"),
      vg.yLabel("↑ Flipper length (mm)")
    ),
    vg.symbolLegend({for: "stroked", columns: 1})
  ),
  vg.vspace(20),
  vg.hconcat(
    vg.plot(
      vg.dot(
        vg.from("penguins"),
        {x: vg.column($x), y: vg.column($y), fill: "species", symbol: "species"}
      ),
      vg.name("filled"),
      vg.grid(true),
      vg.xLabel("Body mass (g) →"),
      vg.yLabel("↑ Flipper length (mm)")
    ),
    vg.symbolLegend({for: "filled", columns: 1})
  )
);