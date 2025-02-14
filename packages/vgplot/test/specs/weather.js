import { dataPath } from '../util/data-path.js';

export default async function(vg) {
  await vg.context.coordinator.exec([
    vg.loadParquet("weather", dataPath("seattle-weather.parquet"))
  ]);

  const $click = vg.Selection.single();
  const $domain = vg.Param.array(["sun", "fog", "drizzle", "rain", "snow"]);
  const $colors = vg.Param.array(["#e7ba52", "#a7a7a7", "#aec7e8", "#1f77b4", "#9467bd"]);
  const $range = vg.Selection.intersect();

  return vg.vconcat(
    vg.hconcat(
      vg.plot(
        vg.dot(
          vg.from("weather", {filterBy: $click}),
          {
            x: vg.dateMonthDay("date"),
            y: "temp_max",
            fill: "weather",
            r: "precipitation",
            fillOpacity: 0.7
          }
        ),
        vg.intervalX({as: $range, brush: {fill: "none", stroke: "#888"}}),
        vg.highlight({by: $range, fill: "#ccc", fillOpacity: 0.2}),
        vg.colorLegend({as: $click, columns: 1}),
        vg.xyDomain(vg.Fixed),
        vg.xTickFormat("%b"),
        vg.colorDomain($domain),
        vg.colorRange($colors),
        vg.rDomain(vg.Fixed),
        vg.rRange([2, 10]),
        vg.width(680),
        vg.height(300)
      )
    ),
    vg.plot(
      vg.barX(
        vg.from("weather"),
        {x: vg.count(), y: "weather", fill: "#ccc", fillOpacity: 0.2, orderby: "weather"}
      ),
      vg.barX(
        vg.from("weather", {filterBy: $range}),
        {x: vg.count(), y: "weather", fill: "weather"}
      ),
      vg.toggleY({as: $click}),
      vg.highlight({by: $click}),
      vg.xDomain(vg.Fixed),
      vg.yDomain($domain),
      vg.yLabel(null),
      vg.colorDomain($domain),
      vg.colorRange($colors),
      vg.width(680)
    )
  );
}
