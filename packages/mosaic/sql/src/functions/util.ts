import type { ExprValue } from '../types.js';
import { fn } from '../util/function.js';

/**
 * Returns the first non-null argument.
 * @param expr The input expressions.
 */
export function coalesce(...expr: ExprValue[]) {
  return fn('coalesce', ...expr);
}
