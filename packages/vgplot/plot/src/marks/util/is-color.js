import { color } from 'd3';

// Derived from Observable Plot’s isColor:
// https://github.com/observablehq/plot/blob/a063b226fec284c5b0e973701fdbbb244ef9ac2c/src/options.js#L462-L477

// Mostly relies on d3-color, with a few extra color keywords. Currently this
// strictly requires that the value be a string; we might want to apply string
// coercion here, though note that d3-color instances would need to support
// valueOf to work correctly with InternMap.
// https://www.w3.org/TR/SVG11/painting.html#SpecifyingPaint
export function isColor(value) {
  if (typeof value !== "string") return false;
  value = value.toLowerCase().trim();
  return (
    value === "none" ||
    value === "currentcolor" ||
    (value.startsWith("url(") && value.endsWith(")")) || // <funciri>, e.g. pattern or gradient
    (value.startsWith("var(") && value.endsWith(")")) || // CSS variable
    color(value) !== null
  );
}
