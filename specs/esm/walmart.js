import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadSpatial("states", "data/us-counties-10m.json", {layer: "states"})
);
await vg.coordinator().exec(
  vg.loadSpatial("nation", "data/us-counties-10m.json", {layer: "nation"})
);
await vg.coordinator().exec(
  vg.loadCSV("walmarts", "data/walmarts.tsv", {delim: "\t"})
);

export default vg.vconcat(
  vg.plot(
    vg.geo(
      vg.from("states"),
      {stroke: "#aaa", strokeWidth: 1}
    ),
    vg.geo(
      vg.from("nation"),
      {stroke: "currentColor"}
    ),
    vg.dot(
      vg.from("walmarts"),
      {
        x: "longitude",
        y: "latitude",
        fy: vg.sql`10 * decade(date)`,
        r: 1.5,
        fill: "blue"
      }
    ),
    vg.axisFy({frameAnchor: "top", dy: 30, tickFormat: "d"}),
    vg.margin(0),
    vg.padding(0),
    vg.fyLabel(null),
    vg.projectionType("albers")
  )
);