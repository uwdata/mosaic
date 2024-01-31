import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadParquet("penguins", "data/penguins.parquet")
);

const $mesh = vg.Param.value(0);
const $hull = vg.Param.value(0);

export default vg.vconcat(
  vg.plot(
    vg.voronoi(
      vg.from("penguins"),
      {
        x: "bill_length",
        y: "bill_depth",
        stroke: "white",
        strokeWidth: 1,
        strokeOpacity: 0.5,
        inset: 1,
        fill: "species",
        fillOpacity: 0.2
      }
    ),
    vg.hull(
      vg.from("penguins"),
      {
        x: "bill_length",
        y: "bill_depth",
        stroke: "species",
        strokeOpacity: $hull,
        strokeWidth: 1.5
      }
    ),
    vg.delaunayMesh(
      vg.from("penguins"),
      {
        x: "bill_length",
        y: "bill_depth",
        z: "species",
        stroke: "species",
        strokeOpacity: $mesh,
        strokeWidth: 1
      }
    ),
    vg.dot(
      vg.from("penguins"),
      {x: "bill_length", y: "bill_depth", fill: "species", r: 2}
    ),
    vg.frame(),
    vg.inset(10),
    vg.width(680)
  ),
  vg.hconcat(
    vg.menu({
      label: "Delaunay Mesh",
      options: [{value: 0, label: "Hide"}, {value: 0.5, label: "Show"}],
      as: $mesh
    }),
    vg.hspace(5),
    vg.menu({
      label: "Convex Hull",
      options: [{value: 0, label: "Hide"}, {value: 1, label: "Show"}],
      as: $hull
    })
  )
);