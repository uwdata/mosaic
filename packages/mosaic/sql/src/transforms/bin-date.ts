import type { ExprNode } from '../ast/node.js';
import type { ExprValue } from '../types.js';
import { dateBin } from '../functions/datetime.js';
import { interval } from '../functions/interval.js';
import { add } from '../functions/operators.js';
import { timeInterval, type DateTimeValue, type TimeUnit } from './util/time-interval.js';

export interface BinDateOptions {
  /**
   * A string indicating a time interval unit,
   * such as 'year', 'day', or 'hour'.
   */
  interval?: TimeUnit;
  /**
   * The number of time interval steps to take, such as 2 years or 3 months.
   */
  step?: number;
  /**
   * The number of bin steps (default 0) by which to offset the result.
   */
  offset?: number;
  /**
   * The desired number of binning steps. This value is a hint,
   * it does not guarantee an exact number of steps.
   */
  steps?: number;
}

/**
 * Return a SQL expression for date/time bins.
 * @param field The column or expression to bin.
 * @param extent The min/max extent over which to bin.
 * @param options Datetime binning options.
 */
export function binDate(
  field: ExprValue,
  extent: [DateTimeValue, DateTimeValue],
  options: BinDateOptions = {}
): ExprNode {
  const { offset = 0 } = options;

  // use interval if provided, otherwise determine from extent
  const { unit, step = 1 } = options.interval
    ? { unit: options.interval, step: options.step }
    : timeInterval(extent[0], extent[1], options.steps || 40);
  const bin = dateBin(field, unit, step);
  return offset ? add(bin, interval(unit, offset * step)) : bin;
}
