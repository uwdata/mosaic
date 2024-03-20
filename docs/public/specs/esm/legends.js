import * as vg from "@uwdata/vgplot";

const $toggle = vg.Selection.single();
const $interval = vg.Selection.intersect();
const $domain = vg.Param.array(["foo", "bar", "baz", "bop", "doh"]);

const defaultAttributes = [
  vg.margin(0),
  vg.width(0),
  vg.height(20)
];

export default vg.vconcat(
  vg.hconcat(
    vg.plot(
      vg.colorLegend({label: "Color Swatch", as: $toggle}),
      ...defaultAttributes,
      vg.name("color-categorical"),
      vg.colorScale("categorical"),
      vg.colorDomain($domain)
    ),
    vg.hspace(35),
    vg.colorLegend({for: "color-categorical", label: "Color Swatch (External)", as: $toggle})
  ),
  vg.hconcat(
    vg.plot(
      vg.symbolLegend({label: "Symbol Swatch", as: $toggle}),
      ...defaultAttributes,
      vg.name("symbol-categorical"),
      vg.symbolDomain($domain)
    ),
    vg.hspace(35),
    vg.symbolLegend({for: "symbol-categorical", label: "Symbol Swatch (External)", as: $toggle})
  ),
  vg.vspace(1em),
  vg.hconcat(
    vg.plot(
      vg.opacityLegend({label: "Opacity Ramp", as: $interval}),
      ...defaultAttributes,
      vg.name("opacity-linear"),
      vg.opacityDomain([0, 100])
    ),
    vg.hspace(30),
    vg.opacityLegend({for: "opacity-linear", label: "Opacity Ramp (External)", as: $interval})
  ),
  vg.hconcat(
    vg.plot(
      vg.opacityLegend(),
      ...defaultAttributes,
      vg.name("opacity-linear-no-label"),
      vg.opacityDomain([0, 100])
    ),
    vg.hspace(30),
    vg.opacityLegend({for: "opacity-linear-no-label"})
  ),
  vg.vspace(1em),
  vg.hconcat(
    vg.plot(
      vg.colorLegend({label: "Linear Color Ramp", as: $interval}),
      ...defaultAttributes,
      vg.name("color-linear"),
      vg.colorDomain([0, 100])
    ),
    vg.hspace(30),
    vg.colorLegend({for: "color-linear", label: "Linear Color Ramp (External)", as: $interval})
  ),
  vg.hconcat(
    vg.plot(
      vg.colorLegend(),
      ...defaultAttributes,
      vg.name("color-linear-no-label"),
      vg.colorDomain([0, 100])
    ),
    vg.hspace(30),
    vg.colorLegend({for: "color-linear-no-label"})
  ),
  vg.vspace(1em),
  vg.hconcat(
    vg.plot(
      vg.colorLegend({label: "Logarithmic Color Ramp", as: $interval}),
      ...defaultAttributes,
      vg.name("color-log"),
      vg.colorScale("log"),
      vg.colorDomain([1, 100])
    ),
    vg.hspace(30),
    vg.colorLegend({
      for: "color-log",
      label: "Logarithmic Color Ramp (External)",
      as: $interval
    })
  ),
  vg.hconcat(
    vg.plot(
      vg.colorLegend({label: "Diverging Color Ramp", as: $interval}),
      ...defaultAttributes,
      vg.name("color-diverging"),
      vg.colorScale("diverging"),
      vg.colorDomain([-100, 100]),
      vg.colorConstant(20)
    ),
    vg.hspace(30),
    vg.colorLegend({
      for: "color-diverging",
      label: "Diverging Color Ramp (External)",
      as: $interval
    })
  ),
  vg.hconcat(
    vg.plot(
      vg.colorLegend({label: "Diverging Symlog Color Ramp", as: $interval}),
      ...defaultAttributes,
      vg.name("color-diverging-symlog"),
      vg.colorScale("diverging-symlog"),
      vg.colorDomain([-100, 100]),
      vg.colorConstant(20)
    ),
    vg.hspace(30),
    vg.colorLegend({
      for: "color-diverging-symlog",
      label: "Diverging Symlog Color Ramp (External)",
      as: $interval
    })
  ),
  vg.hconcat(
    vg.plot(
      vg.colorLegend({label: "Quantize Color Ramp"}),
      ...defaultAttributes,
      vg.name("color-quantize"),
      vg.colorScale("quantize"),
      vg.colorDomain([0, 100])
    ),
    vg.hspace(30),
    vg.colorLegend({for: "color-quantize", label: "Quantize Color Ramp (External)"})
  ),
  vg.hconcat(
    vg.plot(
      vg.colorLegend({label: "Threshold Color Ramp"}),
      ...defaultAttributes,
      vg.name("color-threshold"),
      vg.colorScale("threshold"),
      vg.colorDomain([0, 10, 20, 40, 80])
    ),
    vg.hspace(30),
    vg.colorLegend({for: "color-threshold", label: "Threshold Color Ramp (External)"})
  )
);