import { CaseNode, WhenNode } from '../ast/case.js';
import { asNode } from '../util/ast.js';

/**
 * Create a new conditional CASE statement. If three arguments are provided,
 * acts like a ternary conditional (if, then else). If no arguments are
 * provided, the chained `when` and `else` methods can be used to to complete
 * a conditional statement with WHEN/THEN and ELSE expressions.
 * @param {import('../types.js').ExprValue} [when]
 *  A conditional WHEN expression.
 * @param {import('../types.js').ExprValue} [then]
 *  A THEN value expression.
 * @param {import('../types.js').ExprValue} [other]
 *  An ELSE expression.
 * @returns {CaseNode}
 */
export function cond(when, then, other) {
  return when
    ? new CaseNode(undefined, [new WhenNode(asNode(when), asNode(then))], asNode(other))
    : new CaseNode();
}
