import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadExtension("spatial"),
  vg.loadSpatial("feed", "data/usgs-feed.geojson"),
  vg.loadSpatial("world", "data/countries-110m.json", {layer: "land"})
]);

export default vg.plot(
  vg.geo(
    vg.from("world"),
    {fill: "currentColor", fillOpacity: 0.2}
  ),
  vg.sphere({strokeWidth: 0.5}),
  vg.geo(
    vg.from("feed"),
    {
      r: vg.sql`POW(10, mag)`,
      stroke: "red",
      fill: "red",
      fillOpacity: 0.2,
      title: "title",
      href: "url",
      target: "_blank"
    }
  ),
  vg.margin(2),
  vg.projectionType("equirectangular")
);