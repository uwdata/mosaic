import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("penguins", "data/penguins.parquet")
]);

const $sel = vg.Selection.intersect();

export default vg.hconcat(
  vg.plot(
    vg.frame(),
    vg.dot(
      vg.from("penguins"),
      {x: "bill_length", y: "bill_depth", fill: "#aaa", r: 1}
    ),
    vg.dot(
      vg.from("penguins"),
      {
        x: "bill_length",
        y: "bill_depth",
        fill: "species",
        fx: "sex",
        fy: "species"
      }
    ),
    vg.intervalXY({as: $sel, brush: {stroke: "transparent"}}),
    vg.highlight({by: $sel}),
    vg.name("plot"),
    vg.grid(true),
    vg.marginRight(60),
    vg.xDomain(vg.Fixed),
    vg.yDomain(vg.Fixed),
    vg.fxDomain(vg.Fixed),
    vg.fyDomain(vg.Fixed),
    vg.fxLabel(null),
    vg.fyLabel(null)
  )
);