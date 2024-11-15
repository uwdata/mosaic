import { fn } from '../util/function.js';

/**
 * Return true if the floating point value is not a number, false otherwise.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function isNaN(expr) {
  return fn('isnan', expr);
}

/**
 * Return true if the floating point value is finite, false otherwise.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function isFinite(expr) {
  return fn('isfinite', expr);
}

/**
 * Return true if the floating point value is infinite, false otherwise.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function isInfinite(expr) {
  return fn('isinf', expr);
}

/**
 * Selects the largest value.
 * @param {...import('../types.js').ExprValue} expr The input expressions.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function greatest(...expr) {
  return fn('greatest', ...expr);
}

/**
 * Selects the smallest value.
 * @param {...import('../types.js').ExprValue} expr The input expressions.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function least(...expr) {
  return fn('least', ...expr);
}

/**
 * Compute the exponentional function `e ** expr`.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function exp(expr) {
  return fn('exp', expr);
}

/**
 * Compute a base 10 logarithm.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function log(expr) {
  return fn('log', expr);
}

/**
 * Compute a natural logarithm.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function ln(expr) {
  return fn('ln', expr);
}

/**
 * Compute the sign of a number.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function sign(expr) {
  return fn('sign', expr);
}

/**
 * Compute the absolute value of a number.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function abs(expr) {
  return fn('abs', expr);
}

/**
 * Compute the square root of a number.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function sqrt(expr) {
  return fn('sqrt', expr);
}

/**
 * Rounds the number up.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function ceil(expr) {
  return fn('ceil', expr);
}

/**
 * Rounds the number down.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function floor(expr) {
  return fn('floor', expr);
}

/**
 * Round to the given decimal places.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @param {import('../types.js').ExprValue} [places] The decimal places.
 *  Negative values are allowed, to round to tens, hundreds, etc.
 *  If unspecified, defaults to zero.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function round(expr, places) {
  return fn('round', expr, places);
}

/**
 * Truncates the number.
 * @param {import('../types.js').ExprValue} expr The input number.
 * @returns {import('../ast/function.js').FunctionNode}
 */
export function trunc(expr) {
  return fn('trunc', expr);
}
