import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadCSV("penguins", "data/penguins.csv")
);

const $xs = vg.Selection.intersect();
const $ys = vg.Selection.intersect();
const $zs = vg.Selection.intersect();
const $ws = vg.Selection.intersect();

export default vg.hconcat(
  vg.vconcat(
    vg.plot(
      vg.frame(),
      vg.dot(
        vg.from("penguins"),
        { x: "bill_length", y: "bill_depth", fill: "species", r: 2, clip: true }
      ),
      vg.panZoom({ x: $xs, y: $ys }),
      vg.width(320),
      vg.height(240)
    ),
    vg.vspace(10),
    vg.plot(
      vg.frame(),
      vg.dot(
        vg.from("penguins"),
        { x: "bill_length", y: "flipper_length", fill: "species", r: 2, clip: true }
      ),
      vg.panZoom({ x: $xs, y: $zs }),
      vg.width(320),
      vg.height(240)
    )
  ),
  vg.hspace(10),
  vg.vconcat(
    vg.plot(
      vg.frame(),
      vg.dot(
        vg.from("penguins"),
        { x: "body_mass", y: "bill_depth", fill: "species", r: 2, clip: true }
      ),
      vg.panZoom({ x: $ws, y: $ys }),
      vg.width(320),
      vg.height(240)
    ),
    vg.vspace(10),
    vg.plot(
      vg.frame(),
      vg.dot(
        vg.from("penguins"),
        { x: "body_mass", y: "flipper_length", fill: "species", r: 2, clip: true }
      ),
      vg.panZoom({ x: $ws, y: $zs }),
      vg.width(320),
      vg.height(240)
    )
  )
);