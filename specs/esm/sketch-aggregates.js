import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("athletes", "data/athletes.parquet")
]);

const $brush = vg.Selection.intersect();

export default vg.vconcat(
  vg.plot(
    vg.rectY(
      vg.from("athletes"),
      {x: vg.bin("height"), y: vg.count(), fill: "steelblue", inset: 0.5}
    ),
    vg.intervalX({as: $brush}),
    vg.xLabel("Height (m) →"),
    vg.yLabel("↑ Athletes"),
    vg.width(700),
    vg.height(150)
  ),
  vg.hconcat(
    vg.plot(
      vg.barX(
        vg.from("athletes", {filterBy: $brush}),
        {x: vg.median("weight"), y: "sport", fill: "steelblue", sort: {y: "-x"}}
      ),
      vg.xLabel("Median weight (kg) →"),
      vg.yLabel(null),
      vg.marginLeft(110),
      vg.width(350),
      vg.height(500)
    ),
    vg.plot(
      vg.barX(
        vg.from("athletes", {filterBy: $brush}),
        {
          x: vg.count("nationality").distinct(),
          y: "sport",
          fill: "steelblue",
          sort: {y: "-x"}
        }
      ),
      vg.xLabel("Distinct nationalities →"),
      vg.yLabel(null),
      vg.marginLeft(110),
      vg.width(350),
      vg.height(500)
    )
  )
);