import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("penguins", "data/penguins.parquet")
]);

export default vg.vconcat(
  vg.hconcat(
    vg.plot(
      vg.dot(
        vg.from("penguins"),
        {
          x: "body_mass",
          y: "flipper_length",
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
        {
          x: "body_mass",
          y: "flipper_length",
          fill: "species",
          symbol: "species"
        }
      ),
      vg.name("filled"),
      vg.grid(true),
      vg.xLabel("Body mass (g) →"),
      vg.yLabel("↑ Flipper length (mm)")
    ),
    vg.symbolLegend({for: "filled", columns: 1})
  )
);