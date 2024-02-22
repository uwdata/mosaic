import { sql } from '@uwdata/mosaic-sql';
import { channelScale } from './channel-scale';

/**
 * Generates a SQL expression for 1D pixel-level binning.
 * Adjusts for scale transformations (log, sqrt, ...).
 * Returns a [binExpression, field] array, where field is the
 * input value that is binned. Often the field is just a column
 * name. For time data, fields are mapped to numerical timestamps.
 */
export function binExpr(mark, channel, n, extent, pad = 1, expr) {
  // get base expression, the channel field unless otherwise given
  const { field } = mark.channelField(channel);
  expr = expr ?? field;

  // extract scale information
  const { type, apply, sqlApply } = channelScale(mark, channel);
  const reverse = !!mark.plot.getAttribute(`${channel}Reverse`);

  // return expressions for (unrounded) bin index and field
  const [lo, hi] = extent.map(v => apply(v));
  const v = sqlApply(expr);
  const f = type === 'time' || type === 'utc' ? v : expr;
  const d = hi === lo ? 0 : (n - pad) / (hi - lo);
  const s = d !== 1 ? ` * ${d}::DOUBLE` : '';
  const bin = reverse
    ? sql`(${hi} - ${v}::DOUBLE)${s}`
    : sql`(${v}::DOUBLE - ${lo})${s}`;
  return [bin, f];
}
