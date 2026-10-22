import type { ExprValue } from '../types.js';
import { SliceNode, SubscriptNode } from '../ast/subscript.js';
import { asLiteral, asNode } from '../util/ast.js';

/**
 * Index into a list, string, struct, or map, as in `expr[index]`.
 * @param expr The expression to index into. String values are
 *  interpreted as column references.
 * @param index The index or key. String values are interpreted as
 *  literals; use `column` for column references.
 */
export function subscript(expr: ExprValue, index: ExprValue) {
  return new SubscriptNode(asNode(expr), asLiteral(index));
}

/**
 * Slice a list or string, as in `expr[start:end:step]`.
 * @param expr The expression to slice. String values are
 *  interpreted as column references.
 * @param start The inclusive start index. If null or undefined,
 *  the slice starts at the beginning.
 * @param end The inclusive end index. If null or undefined,
 *  the slice continues to the end.
 * @param step The step size. If null or undefined, the default
 *  step of 1 is used.
 */
export function slice(
  expr: ExprValue,
  start?: ExprValue,
  end?: ExprValue,
  step?: ExprValue
) {
  const bound = (v?: ExprValue) => v == null ? undefined : asLiteral(v);
  return new SliceNode(asNode(expr), bound(start), bound(end), bound(step));
}
