import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadCSV("athletes", "data/athletes.csv")
);

const $query = vg.Selection.intersect();

export default vg.plot(
  vg.dot(
    vg.from("athletes"),
    { x: "weight", y: "height", fill: "sex", r: 2, opacity: 0.05 }
  ),
  vg.regressionY(
    vg.from("athletes", { filterBy: $query }),
    { x: "weight", y: "height", stroke: "sex" }
  ),
  vg.intervalXY({ as: $query, brush: {"fillOpacity":0,"stroke":"currentColor"} }),
  vg.xyDomain(vg.Fixed),
  vg.colorDomain(vg.Fixed)
);