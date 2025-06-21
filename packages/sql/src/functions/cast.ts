import { CastNode } from '../ast/cast.js';
import { asNode } from '../util/ast.js';

/**
 * Perform a type cast.
 * @param expr The expression to type cast.
 * @param type The type to cast to.
 */
export function cast(expr: unknown, type: string) {
  return new CastNode(asNode(expr), type);
}

/**
 * Cast an expression to a 32-bit integer type.
 * @param expr The expression to type cast.
 */
export function int32(expr: unknown) {
  return cast(expr, 'INTEGER');
}

/**
 * Cast an expression to a 32-bit floating point number type.
 * @param expr The expression to type cast.
 */
export function float32(expr: unknown) {
  return cast(expr, 'FLOAT');
}

/**
 * Cast an expression to a 64-bit floating point number type.
 * @param expr The expression to type cast.
 */
export function float64(expr: unknown) {
  return cast(expr, 'DOUBLE');
}
