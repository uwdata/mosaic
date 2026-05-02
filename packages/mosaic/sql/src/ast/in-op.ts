import { IN_OPERATOR } from '../constants.js';
import { ExprNode } from './node.js';
import type { ListNode } from './list.js';
import type { ScalarSubqueryNode } from './subquery.js';
import type { TupleNode } from './tuple.js';

type SetValues = TupleNode | ListNode | ScalarSubqueryNode;

export class InOpNode extends ExprNode {
  /** The input expression. */
  readonly expr: ExprNode;
  /** The value set. */
  readonly values: SetValues;

  /**
   * Instantiate an in operator node.
   * @param expr The input expression.
   * @param values The value set.
   */
  constructor(expr: ExprNode, values: SetValues) {
    super(IN_OPERATOR);
    this.expr = expr;
    this.values = values;
  }
}
