import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("athletes", "data/athletes.parquet")
]);

const $unit = vg.Param.value(10);
const $round = vg.Param.value(false);
const $gap = vg.Param.value(1);
const $radius = vg.Param.value(0);

export default vg.vconcat(
  vg.hconcat(
    vg.menu({as: $unit, options: [1, 2, 5, 10, 25, 50, 100], label: "Unit"}),
    vg.menu({as: $round, options: [true, false], label: "Round"}),
    vg.menu({as: $gap, options: [0, 1, 2, 3, 4, 5], label: "Gap"}),
    vg.slider({as: $radius, min: 0, max: 10, step: 0.1, label: "Radius"})
  ),
  vg.vspace(10),
  vg.plot(
    vg.waffleY(
      vg.from("athletes"),
      {
        unit: $unit,
        round: $round,
        gap: $gap,
        rx: $radius,
        x: vg.sql`5 * floor(year("date_of_birth") / 5)`,
        y: vg.count()
      }
    ),
    vg.xLabel(null),
    vg.xTickSize(0),
    vg.xTickFormat("d")
  )
);