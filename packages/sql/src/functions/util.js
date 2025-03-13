/**
 * @import { FunctionNode } from '../ast/function.js'
 * @import { ExprValue } from '../types.js'
 */
import { fn } from '../util/function.js';

/**
 * Returns the first non-null argument.
 * @param {...ExprValue} expr The input expressions.
 * @returns {FunctionNode}
 */
export function coalesce(...expr) {
  return fn('coalesce', ...expr);
}
