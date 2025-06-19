import type { ExprValue } from '../types.js';
import { asNode } from '../util/ast.js';
import { fn } from '../util/function.js';
import { interval } from './interval.js';

/**
 * Given a date/time value, return the milliseconds since the UNIX epoch.
 * @param {ExprValue} expr The date/time expression.
 */
export function epoch_ms(expr: ExprValue) {
  return fn('epoch_ms', expr);
}

/**
 * Perform data binning according to the provided interval unit and steps.
 * @param expr The date/time expression to bin.
 * @param unit The datetime interval unit to bin by.
 * @param steps The number of interval steps.
 */
export function dateBin(expr: ExprValue, unit: string, steps: number = 1) {
  return fn('time_bucket', interval(unit, steps), expr);
}

/**
 * Map date/times to a month value, all within the same year for comparison.
 * The resulting value is still date-typed.
 * @param expr The date/time expression.
 */
export function dateMonth(expr: ExprValue) {
  return fn('make_date', 2012, fn('month', expr), 1);
}

/**
 * Map date/times to a month and day value, all within the same year for
 * comparison. The resulting value is still date-typed.
 * @param expr The date/time expression.
 */
export function dateMonthDay(expr: ExprValue) {
  const d = asNode(expr);
  return fn('make_date', 2012, fn('month', d), fn('day', d));
}

/**
 * Map date/times to a day of the month value, all within the same year and month
 * for comparison. The resulting value is still date-typed.
 * @param expr The date/time expression.
 */
export function dateDay(expr: ExprValue) {
  return fn('make_date', 2012, 1, fn('day', expr));
}
