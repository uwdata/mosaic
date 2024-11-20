import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("proteins", "data/protein-design.parquet")
]);

const $query = vg.Selection.crossfilter();
const $point = vg.Selection.intersect({empty: true});
const $plddt_domain = vg.Param.array([67, 94.5]);
const $pae_domain = vg.Param.array([5, 29]);
const $scheme = vg.Param.value("observable10");

export default vg.vconcat(
  vg.hconcat(
    vg.menu({from: "proteins", column: "partial_t", label: "Partial t", as: $query}),
    vg.menu({from: "proteins", column: "noise", label: "Noise", as: $query}),
    vg.menu({
      from: "proteins",
      column: "gradient_decay_function",
      label: "Gradient Decay",
      as: $query
    }),
    vg.menu({
      from: "proteins",
      column: "gradient_scale",
      label: "Gradient Scale",
      as: $query
    })
  ),
  vg.vspace("1.5em"),
  vg.hconcat(
    vg.plot(
      vg.rectY(
        vg.from("proteins", {filterBy: $query}),
        {
          x: vg.bin("plddt_total", {steps: 60}),
          y: vg.count(),
          z: "version",
          fill: "version",
          order: "z",
          reverse: true,
          insetLeft: 0.5,
          insetRight: 0.5
        }
      ),
      vg.width(600),
      vg.height(55),
      vg.xAxis(null),
      vg.yAxis(null),
      vg.xDomain($plddt_domain),
      vg.colorDomain(vg.Fixed),
      vg.colorScheme($scheme),
      vg.marginLeft(40),
      vg.marginRight(0),
      vg.marginTop(0),
      vg.marginBottom(0)
    ),
    vg.hspace(5),
    vg.colorLegend({for: "scatter", columns: 1, as: $query})
  ),
  vg.hconcat(
    vg.plot(
      vg.frame({stroke: "#ccc"}),
      vg.raster(
        vg.from("proteins", {filterBy: $query}),
        {x: "plddt_total", y: "pae_interaction", fill: "version", pad: 0}
      ),
      vg.intervalXY({as: $query, brush: {stroke: "currentColor", fill: "transparent"}}),
      vg.dot(
        vg.from("proteins", {filterBy: $point}),
        {
          x: "plddt_total",
          y: "pae_interaction",
          fill: "version",
          stroke: "currentColor",
          strokeWidth: 0.5
        }
      ),
      vg.name("scatter"),
      vg.opacityDomain([0, 2]),
      vg.opacityClamp(true),
      vg.colorDomain(vg.Fixed),
      vg.colorScheme($scheme),
      vg.xDomain($plddt_domain),
      vg.yDomain($pae_domain),
      vg.xLabelAnchor("center"),
      vg.yLabelAnchor("center"),
      vg.marginTop(0),
      vg.marginLeft(40),
      vg.marginRight(0),
      vg.width(600),
      vg.height(450)
    ),
    vg.plot(
      vg.rectX(
        vg.from("proteins", {filterBy: $query}),
        {
          x: vg.count(),
          y: vg.bin("pae_interaction", {steps: 60}),
          z: "version",
          fill: "version",
          order: "z",
          reverse: true,
          insetTop: 0.5,
          insetBottom: 0.5
        }
      ),
      vg.width(55),
      vg.height(450),
      vg.xAxis(null),
      vg.yAxis(null),
      vg.marginTop(0),
      vg.marginLeft(0),
      vg.marginRight(0),
      vg.yDomain($pae_domain),
      vg.colorDomain(vg.Fixed),
      vg.colorScheme($scheme)
    )
  ),
  vg.vspace("1em"),
  vg.table({
    as: $point,
    filterBy: $query,
    from: "proteins",
    columns: [
    "version",
    "pae_interaction",
    "plddt_total",
    "noise",
    "gradient_decay_function",
    "gradient_scale",
    "movement"
  ],
    width: 680,
    height: 215
  })
);