import { scaleTransform, sql } from '@uwdata/mosaic-sql';

/**
 * Generates a SQL expression for 1D pixel-level binning.
 * Adjusts for scale transformations (log, sqrt, ...).
 * Returns a [binExpression, field] array, where field is the
 * input value that is binned. Often the field is just a column
 * name. For time data, fields are mapped to numerical timestamps.
 */
export function binExpr(mark, channel, n, extent, pad = 1, expr) {
  const { plot } = mark;

  // get base expression, the channel field unless otherwise given
  expr = expr ?? mark.channelField(channel).field;

  // extract scale information
  const reverse = !!plot.getAttribute(`${channel}Reverse`);
  const type = plot.getAttribute(`${channel}Scale`) || scaleType(extent);
  const scale = scaleTransform(type);

  // return expressions for (unrounded) bin index and field
  const [lo, hi] = extent.map(v => scale.apply(v));
  const v = scale.sql(expr);
  const f = type === 'time' || type === 'utc' ? v : expr;
  const d = hi === lo ? 0 : (n - pad) / (hi - lo);
  const s = d !== 1 ? ` * ${d}::DOUBLE` : '';
  const bin = reverse
    ? sql`(${hi} - ${v}::DOUBLE)${s}`
    : sql`(${v}::DOUBLE - ${lo})${s}`;
  return [bin, f];
}

// Check the min/max value types to infer time scales.
function scaleType(extent) {
  return extent[0] instanceof Date || extent[1] instanceof Date
    ? 'time'
    : 'linear';
}
