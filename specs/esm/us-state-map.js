import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadExtension("spatial"),
  vg.loadSpatial("states", "data/us-counties-10m.json", {layer: "states"})
]);

export default vg.plot(
  vg.geo(
    vg.from("states"),
    {stroke: "currentColor", strokeWidth: 1}
  ),
  vg.dot(
    vg.from("states"),
    {
      x: vg.centroidX("geom"),
      y: vg.centroidY("geom"),
      r: 2,
      fill: "steelblue",
      tip: true,
      title: "name"
    }
  ),
  vg.margin(0),
  vg.projectionType("albers")
);