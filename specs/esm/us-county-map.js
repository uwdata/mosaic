import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadSpatial("counties", "data/us-counties-10m.json", {layer: "counties"})
);
await vg.coordinator().exec(
  vg.loadSpatial("states", "data/us-counties-10m.json", {layer: "states"})
);

export default vg.plot(
  vg.geo(
    vg.from("counties"),
    {fill: "currentColor", fillOpacity: 0.2, stroke: "white", strokeWidth: 0.5}
  ),
  vg.geo(
    vg.from("states"),
    {stroke: "white", strokeWidth: 1.5}
  ),
  vg.dot(
    vg.from("counties"),
    {
      x: vg.centroidX("geom"),
      y: vg.centroidY("geom"),
      r: 2,
      fill: "transparent",
      tip: true,
      title: "name"
    }
  ),
  vg.width(1080),
  vg.projectionType("albers")
);