import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("athletesBatched", "data/athletes.parquet", {
  select: ["*", "10 * CEIL(ROW_NUMBER() OVER (PARTITION BY sport) / 10) AS batch"],
  where: "height IS NOT NULL"
})
]);

const $ci = vg.Param.value(0.95);
const $query = vg.Selection.single();

export default vg.hconcat(
  vg.vconcat(
    vg.hconcat(
      vg.slider({
        select: "interval",
        as: $query,
        column: "batch",
        from: "athletesBatched",
        step: 10,
        value: 20,
        label: "Max Samples"
      }),
      vg.slider({as: $ci, min: 0.5, max: 0.999, step: 0.001, label: "Conf. Level"})
    ),
    vg.plot(
      vg.errorbarX(
        vg.from("athletesBatched", {filterBy: $query}),
        {
          ci: $ci,
          x: "height",
          y: "sport",
          stroke: "sex",
          strokeWidth: 1,
          marker: "tick",
          sort: {y: "-x"}
        }
      ),
      vg.text(
        vg.from("athletesBatched"),
        {
          frameAnchor: "right",
          fontSize: 8,
          fill: "#999",
          dx: 25,
          text: vg.count(),
          y: "sport"
        }
      ),
      vg.name("heights"),
      vg.xDomain([1.5, 2.1]),
      vg.yDomain(vg.Fixed),
      vg.yGrid(true),
      vg.yLabel(null),
      vg.marginTop(5),
      vg.marginLeft(105),
      vg.marginRight(30),
      vg.height(420)
    ),
    vg.colorLegend({for: "heights"})
  )
);