import type { ExprValue } from '../types.js';
import { CaseNode, WhenNode } from '../ast/case.js';
import { asNode } from '../util/ast.js';

/**
 * Create a new conditional CASE statement. If three arguments are provided,
 * acts like a ternary conditional (if, then, else). If no arguments are
 * provided, the chained `when` and `else` methods can be used to to complete
 * a conditional statement with WHEN/THEN and ELSE expressions.
 * @param when A conditional WHEN expression.
 * @param then A THEN value expression.
 * @param other An ELSE expression.
 */
export function cond(when?: ExprValue, then?: ExprValue, other?: ExprValue) {
  return when
    ? new CaseNode(undefined, [new WhenNode(asNode(when), asNode(then))], asNode(other))
    : new CaseNode();
}
