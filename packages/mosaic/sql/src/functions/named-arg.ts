import type { ExprValue } from '../types.js';
import { NamedArgNode } from '../ast/named-arg.js';
import { asNode } from '../util/ast.js';

/**
 * Create a named function argument, as in `name := expr`.
 * @param name The argument name.
 * @param expr The argument value. String values are interpreted
 *  as column references; use `literal` for string literals.
 */
export function namedArg(name: string, expr: ExprValue) {
  return new NamedArgNode(name, asNode(expr));
}
