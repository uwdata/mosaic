import { FunctionNode } from '../ast/function.js';
import { IntervalNode } from '../ast/interval.js';
import { asNode } from '../util/ast.js';
import { fn } from '../util/function.js';

/**
 * Create a new interval.
 * @param {string} unit The interval unit, such as day or year.
 * @param {number} steps The number interval unit steps.
 * @returns {IntervalNode}
 */
export function interval(unit, steps) {
  return new IntervalNode(unit, steps);
}

/**
 * Given a date/time value, return the milliseconds since the UNIX epoch.
 * @param {import('../types.js').ExprValue} expr The date/time expression.
 * @returns {FunctionNode}
 */
export function epoch_ms(expr) {
  return fn('epoch_ms', expr);
}

/**
 * Perform data binning according to the provided interval unit and steps.
 * @param {import('../types.js').ExprValue} expr The date/time expression to bin.
 * @param {string} unit The datetime interval unit to bin by.
 * @param {number} [steps=1] The number of interval steps.
 * @returns {FunctionNode}
 */
export function dateBin(expr, unit, steps = 1) {
  return fn('time_bucket', interval(unit, steps), expr);
}

/**
 * Map date/times to a month value, all within the same year for comparison.
 * The resulting value is still date-typed.
 * @param {import('../types.js').ExprValue} expr The date/time expression.
 * @returns {FunctionNode}
 */
export function dateMonth(expr) {
  return fn('make_date', 2012, fn('month', expr), 1);
}

/**
 * Map date/times to a month and day value, all within the same year for
 * comparison. The resulting value is still date-typed.
 * @param {import('../types.js').ExprValue} expr The date/time expression.
 * @returns {FunctionNode}
 */
export function dateMonthDay(expr) {
  const d = asNode(expr);
  return fn('make_date', 2012, fn('month', d), fn('day', d));
}

/**
 * Map date/times to a day of the month value, all within the same year and month
 * for comparison. The resulting value is still date-typed.
 * @param {import('../types.js').ExprValue} expr The date/time expression.
 * @returns {FunctionNode}
 */
export function dateDay(expr) {
  return fn('make_date', 2012, 1, fn('day', expr));
}
