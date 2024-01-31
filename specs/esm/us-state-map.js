import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadSpatial("states", "data/us-counties-10m.json", {layer: "states"})
);

export default vg.plot(
  vg.geo(
    vg.from("states"),
    {fill: "currentColor", fillOpacity: 0.15, stroke: "white", strokeWidth: 1}
  ),
  vg.dot(
    vg.from("states"),
    {
      x: vg.centroidX("geom"),
      y: vg.centroidY("geom"),
      r: 2,
      fill: "#888",
      tip: true,
      title: "name"
    }
  ),
  vg.projectionType("albers")
);