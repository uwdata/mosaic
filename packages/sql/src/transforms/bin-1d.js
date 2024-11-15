import { float64 } from '../functions/cast.js';
import { mul, sub } from '../functions/operators.js';

/**
 * Compute binned values over a one-dimensional extent.
 * @param {import('../types.js').ExprValue} x The expression to bin.
 *  The expression must return numeric values. For example, to bin
 *  datetime values, the input expression might map them to numeric
 *  values such as milliseconds since the epoch.
 * @param {number} lo The low value of the bin extent.
 * @param {number} hi The high value of the bin extent.
 * @param {number} bins The integer number of bins to use within the
 *  defined binning extent.
 * @param {boolean} [reverse] Flag indicating if bins should be
 *  produced in reverse order from *hi* to *lo* (default `false`).
 */
export function bin1d(x, lo, hi, bins, reverse) {
  const diff = reverse ? sub(hi, float64(x)) : sub(float64(x), lo);
  const scale = hi === lo ? 0 : bins / (hi - lo);
  return scale ? mul(diff, float64(scale)) : diff;
}
