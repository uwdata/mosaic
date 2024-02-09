import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("presidents", "data/us-president-favorability.parquet")
]);

const $sign = vg.Param.value(1);

export default vg.vconcat(
  vg.plot(
    vg.ruleY([0]),
    vg.image(
      vg.from("presidents"),
      {
        x: "First Inauguration Date",
        y: vg.sql`"Very Favorable %" + "Somewhat Favorable %" + ${$sign} * ("Very Unfavorable %" + "Somewhat Unfavorable %")`,
        src: "Portrait URL",
        r: 20,
        preserveAspectRatio: "xMidYMin slice",
        title: "Name"
      }
    ),
    vg.xInset(20),
    vg.xLabel("First inauguration date →"),
    vg.yInsetTop(4),
    vg.yGrid(true),
    vg.yLabel("↑ Opinion (%)"),
    vg.yTickFormat("+f")
  ),
  vg.menu({
    label: "Opinion Metric",
    options: [{label: "Any Opinion", value: 1}, {label: "Net Favorability", value: -1}],
    as: $sign
  })
);