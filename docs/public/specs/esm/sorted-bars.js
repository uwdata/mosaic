import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadParquet("athletes", "data/athletes.parquet")
);

const $query = vg.Selection.intersect();

export default vg.vconcat(
  vg.menu({ label: "Sport", as: $query, from: "athletes", column: "sport", value: "aquatics" }),
  vg.vspace(10),
  vg.plot(
    vg.barX(
      vg.from("athletes", { filterBy: $query }),
      { x: vg.sum("gold"), y: "nationality", fill: "steelblue", sort: {"y":"-x","limit":10} }
    ),
    vg.xLabel("Gold Medals"),
    vg.yLabel("Nationality"),
    vg.yLabelAnchor("top"),
    vg.marginTop(15)
  )
);