import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadExtension("spatial"),
  vg.loadSpatial("counties", "data/us-counties-10m.json", {layer: "counties"}),
  vg.loadSpatial("states", "data/us-counties-10m.json", {layer: "states"})
]);

export default vg.plot(
  vg.geo(
    vg.from("counties"),
    {stroke: "currentColor", strokeWidth: 0.25}
  ),
  vg.geo(
    vg.from("states"),
    {stroke: "currentColor", strokeWidth: 1}
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
  vg.margin(0),
  vg.projectionType("albers")
);