import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadSpatial("earthquakes", "data/usgs-feed.geojson")
);
await vg.coordinator().exec(
  vg.loadSpatial("world", "data/countries-110m.json", {layer: "land"})
);

export default vg.plot(
  vg.geo(
    vg.from("world"),
    {fill: "currentColor", fillOpacity: 0.2}
  ),
  vg.sphere({strokeWidth: 0.5}),
  vg.geo(
    vg.from("earthquakes"),
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
  vg.margins({left: 5, top: 5, right: 5, bottom: 5}),
  vg.projectionType("equirectangular")
);