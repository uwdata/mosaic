
import { IN_SUBQUERY } from '../constants.js';
import { ExprNode } from './node.js';
import { ScalarSubqueryNode } from './subquery.js';

export class InSubqueryNode extends ExprNode {
  /** The input expression. */
  readonly expr: ExprNode;
  /** The value set. */
  readonly subquery: ScalarSubqueryNode;

  /**
   * Instantiate an in operator node.
   * @param expr The input expression.
   * @param subquery The scalar subquery to test inclusion in.
   */
  constructor(expr: ExprNode, subquery: ScalarSubqueryNode) {
    super(IN_SUBQUERY);
    this.expr = expr;
    this.subquery = subquery;
  }
}
