import { CastNode } from '../ast/cast.js';
import { asNode } from '../util/ast.js';

/**
 * Perform a type cast.
 * @param {*} expr The expression to type cast.
 * @param {string} type The type to cast to.
 * @returns {CastNode}
 */
export function cast(expr, type) {
  return new CastNode(asNode(expr), type);
}

/**
 * Cast an expression to a 32-bit integer type.
 * @param {*} expr The expression to type cast.
 * @returns {CastNode}
 */
export function int32(expr) {
  return cast(expr, 'INTEGER');
}

/**
 * Cast an expression to a 32-bit floating point number type.
 * @param {*} expr The expression to type cast.
 * @returns {CastNode}
 */
export function float32(expr) {
  return cast(expr, 'FLOAT');
}

/**
 * Cast an expression to a 64-bit floating point number type.
 * @param {*} expr The expression to type cast.
 * @returns {CastNode}
 */
export function float64(expr) {
  return cast(expr, 'DOUBLE');
}
