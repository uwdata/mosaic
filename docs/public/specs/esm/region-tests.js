import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadExtension("spatial"),
  vg.loadParquet("bls_unemp", "data/bls-metro-unemployment.parquet"),
  vg.loadSpatial("feed", "data/usgs-feed.geojson"),
  vg.loadSpatial("world", "data/countries-110m.json", {layer: "land"}),
  vg.loadSpatial("counties", "data/us-counties-10m.json", {layer: "counties"})
]);

const $series = vg.Selection.single();
const $quakes = vg.Selection.single();
const $counties = vg.Selection.single();

export default vg.vconcat(
  vg.plot(
    vg.ruleY([0]),
    vg.lineY(
      vg.from("bls_unemp", {optimize: false}),
      {
        x: "date",
        y: "unemployment",
        z: "division",
        stroke: "steelblue",
        strokeOpacity: 0.9,
        curve: "monotone-x"
      }
    ),
    vg.region({channels: ["z"], as: $series}),
    vg.highlight({by: $series}),
    vg.marginLeft(24),
    vg.xLabel(null),
    vg.xTicks(10),
    vg.yLabel("Unemployment (%)"),
    vg.yGrid(true),
    vg.marginRight(0)
  ),
  vg.vspace(10),
  vg.plot(
    vg.geo(
      vg.from("world"),
      {fill: "currentColor", fillOpacity: 0.2}
    ),
    vg.sphere({strokeWidth: 0.5}),
    vg.geo(
      vg.from("feed"),
      {
        channels: {id: "id"},
        r: vg.sql`POW(10, mag)`,
        stroke: "red",
        fill: "red",
        fillOpacity: 0.2,
        title: "title",
        href: "url",
        target: "_blank"
      }
    ),
    vg.region({channels: ["id"], as: $quakes}),
    vg.highlight({by: $quakes}),
    vg.margin(2),
    vg.projectionType("equirectangular")
  ),
  vg.vspace(10),
  vg.plot(
    vg.geo(
      vg.from("counties"),
      {channels: {id: "id"}, stroke: "currentColor", strokeWidth: 0.25}
    ),
    vg.region({channels: ["id"], as: $counties}),
    vg.highlight({by: $counties}),
    vg.margin(0),
    vg.projectionType("albers")
  )
);