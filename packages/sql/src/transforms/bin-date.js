/**
 * @import { ExprNode } from '../ast/node.js'
 * @import { ExprValue, TimeUnit } from '../types.js'
 */
import { dateBin } from '../functions/datetime.js';
import { interval } from '../functions/interval.js';
import { add } from '../functions/operators.js';
import { timeInterval } from './util/time-interval.js';

/**
 * @typedef {object} BinDateOptions
 * @property {TimeUnit} [interval] A string indicating a time interval
 *  unit, such as 'year', 'day', or 'hour'.
 * @property {number} [step] The number of time interval steps to
 *  take, such as 2 years or 3 months.
 * @property {number} [offset] The number of bin steps (default 0) by
 *  which to offset the result.
 * @property {number} [steps] The desired number of binning steps.
 *  This value is a hint, it does not guarantee an exact number of steps.
 */

/**
 * Return a SQL expression for date/time bins.
 * @param {ExprValue} field The column or expression to bin.
 * @param {[Date|number, Date|number]} extent The min/max extent over which to bin.
 * @param {BinDateOptions} [options] Datetime binning options.
 * @returns {ExprNode}
 */
export function binDate(field, extent, options = {}) {
  const { offset = 0 } = options;

  // use interval if provided, otherwise determine from extent
  const { unit, step = 1 } = options.interval
    ? { unit: options.interval, step: options.step }
    : timeInterval(extent[0], extent[1], options.steps || 40);
  const bin = dateBin(field, unit, step);
  return offset ? add(bin, interval(unit, offset * step)) : bin;
}
