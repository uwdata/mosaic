import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadParquet("penguins", "data/penguins.parquet")
);

const $brush = vg.Selection.single();

const defaultAttributes = [
  vg.xTicks(3),
  vg.yTicks(4),
  vg.xDomain(vg.Fixed),
  vg.yDomain(vg.Fixed),
  vg.colorDomain(vg.Fixed),
  vg.marginTop(5),
  vg.marginBottom(10),
  vg.marginLeft(10),
  vg.marginRight(5),
  vg.xAxis(null),
  vg.yAxis(null),
  vg.xLabelAnchor("center"),
  vg.yLabelAnchor("center"),
  vg.xTickFormat("s"),
  vg.yTickFormat("s"),
  vg.width(150),
  vg.height(150)
];

export default vg.vconcat(
  vg.hconcat(
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "bill_length", y: "body_mass", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes,
      vg.yAxis("left"),
      vg.marginLeft(45),
      vg.width(185)
    ),
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "bill_depth", y: "body_mass", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes
    ),
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "flipper_length", y: "body_mass", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes
    ),
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "body_mass", y: "body_mass", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes
    )
  ),
  vg.hconcat(
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "bill_length", y: "flipper_length", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes,
      vg.yAxis("left"),
      vg.marginLeft(45),
      vg.width(185)
    ),
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "bill_depth", y: "flipper_length", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes
    ),
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "flipper_length", y: "flipper_length", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes
    ),
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "body_mass", y: "flipper_length", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes
    )
  ),
  vg.hconcat(
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "bill_length", y: "bill_depth", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes,
      vg.yAxis("left"),
      vg.marginLeft(45),
      vg.width(185)
    ),
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "bill_depth", y: "bill_depth", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes
    ),
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "flipper_length", y: "bill_depth", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes
    ),
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "body_mass", y: "bill_depth", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes
    )
  ),
  vg.hconcat(
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "bill_length", y: "bill_length", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes,
      vg.yAxis("left"),
      vg.xAxis("bottom"),
      vg.marginLeft(45),
      vg.marginBottom(35),
      vg.width(185),
      vg.height(175)
    ),
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "bill_depth", y: "bill_length", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes,
      vg.xAxis("bottom"),
      vg.height(175),
      vg.marginBottom(35)
    ),
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "flipper_length", y: "bill_length", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes,
      vg.xAxis("bottom"),
      vg.height(175),
      vg.marginBottom(35)
    ),
    vg.plot(
      vg.frame({ stroke: "#ccc" }),
      vg.dot(
        vg.from("penguins"),
        { x: "body_mass", y: "bill_length", fill: "species", r: 2 }
      ),
      vg.intervalXY({ as: $brush }),
      vg.highlight({ by: $brush, opacity: 0.1 }),
      ...defaultAttributes,
      vg.xAxis("bottom"),
      vg.height(175),
      vg.marginBottom(35)
    )
  )
);