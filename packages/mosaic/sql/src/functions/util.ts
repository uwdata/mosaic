import type { ExprValue } from '../types.js';
import { fn } from '../util/function.js';

/**
 * Returns the first non-null argument.
 * @param expr The input expressions.
 */
export function coalesce(...expr: ExprValue[]) {
  return fn('coalesce', ...expr);
}

/**
 * Returns null if the two arguments are equal, otherwise returns the first.
 * @param a The input expression.
 * @param b The expression to compare against.
 */
export function nullif(a: ExprValue, b: ExprValue) {
  return fn('nullif', a, b);
}
