import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadSpatial("counties", "data/us-counties-10m.json", {layer: "counties"})
);
await vg.coordinator().exec(
  vg.loadCSV("rates", "data/us-county-unemployment.csv")
);
await vg.coordinator().exec(
  `CREATE TEMP TABLE IF NOT EXISTS combined AS SELECT a.geom AS geom, b.rate AS rate FROM counties AS a, rates AS b WHERE a.id = b.id
`
);

export default vg.vconcat(
  vg.colorLegend({for: "county-map", label: "Unemployment (%)"}),
  vg.plot(
    vg.geo(
      vg.from("combined"),
      {fill: "rate", title: vg.sql`concat(rate, '%')`}
    ),
    vg.name("county-map"),
    vg.margins({left: 5, top: 5, right: 5, bottom: 5}),
    vg.colorScale("quantile"),
    vg.colorN(9),
    vg.colorScheme("blues"),
    vg.projectionType("albers-usa")
  )
);