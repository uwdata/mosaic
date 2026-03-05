import type { ExprValue } from '../types.js';
import { fn } from '../util/function.js';

/**
 * Return true if the floating point value is not a number, false otherwise.
 * @param expr The input number.
 */
export function isNaN(expr: ExprValue) {
  return fn('isnan', expr);
}

/**
 * Return true if the floating point value is finite, false otherwise.
 * @param expr The input number.
 */
export function isFinite(expr: ExprValue) {
  return fn('isfinite', expr);
}

/**
 * Return true if the floating point value is infinite, false otherwise.
 * @param expr The input number.
 */
export function isInfinite(expr: ExprValue) {
  return fn('isinf', expr);
}

/**
 * Selects the largest value.
 * @param expr The input expressions.
 */
export function greatest(...expr: ExprValue[]) {
  return fn('greatest', ...expr);
}

/**
 * Selects the smallest value.
 * @param expr The input expressions.
 */
export function least(...expr: ExprValue[]) {
  return fn('least', ...expr);
}

/**
 * Compute the exponentional function `e ** expr`.
 * @param expr The input number.
 */
export function exp(expr: ExprValue) {
  return fn('exp', expr);
}

/**
 * Compute a base 10 logarithm.
 * @param expr The input number.
 */
export function log(expr: ExprValue) {
  return fn('log', expr);
}

/**
 * Compute a natural logarithm.
 * @param expr The input number.
 */
export function ln(expr: ExprValue) {
  return fn('ln', expr);
}

/**
 * Compute the sign of a number.
 * @param expr The input number.
 */
export function sign(expr: ExprValue) {
  return fn('sign', expr);
}

/**
 * Compute the absolute value of a number.
 * @param expr The input number.
 */
export function abs(expr: ExprValue) {
  return fn('abs', expr);
}

/**
 * Compute the square root of a number.
 * @param expr The input number.
 */
export function sqrt(expr: ExprValue) {
  return fn('sqrt', expr);
}

/**
 * Rounds the number up.
 * @param expr The input number.
 */
export function ceil(expr: ExprValue) {
  return fn('ceil', expr);
}

/**
 * Rounds the number down.
 * @param expr The input number.
 */
export function floor(expr: ExprValue) {
  return fn('floor', expr);
}

/**
 * Round to the given decimal places.
 * @param expr The input number.
 * @param places The decimal places.
 *  Negative values are allowed, to round to tens, hundreds, etc.
 *  If unspecified, defaults to zero.
 */
export function round(expr: ExprValue, places?: ExprValue) {
  return fn('round', expr, places);
}

/**
 * Truncates the number.
 * @param expr The input number.
 */
export function trunc(expr: ExprValue) {
  return fn('trunc', expr);
}
