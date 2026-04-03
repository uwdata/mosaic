import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadExtension("spatial"),
  vg.loadSpatial("counties", "data/us-counties-10m.json", {layer: "counties"}),
  vg.loadParquet("rates", "data/us-county-unemployment.parquet"),
  `CREATE TABLE IF NOT EXISTS combined AS SELECT a.geom AS geom, b.rate AS rate FROM counties AS a, rates AS b WHERE a.id = b.id`
]);

export default vg.vconcat(
  vg.colorLegend({for: "county-map", label: "Unemployment (%)"}),
  vg.plot(
    vg.geo(
      vg.from("combined"),
      {fill: "rate", title: vg.sql`concat(rate, '%')`}
    ),
    vg.name("county-map"),
    vg.margin(0),
    vg.colorScale("quantile"),
    vg.colorN(9),
    vg.colorScheme("blues"),
    vg.projectionType("albers-usa")
  )
);