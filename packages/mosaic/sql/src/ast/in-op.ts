import { IN_OPERATOR } from '../constants.js';
import { ExprNode } from './node.js';

export class InOpNode extends ExprNode {
  /** The input expression. */
  readonly expr: ExprNode;
  /** The value set. */
  readonly values: ExprNode[];

  /**
   * Instantiate an in operator node.
   * @param expr The input expression.
   * @param values The value set.
   */
  constructor(expr: ExprNode, values: ExprNode[]) {
    super(IN_OPERATOR);
    this.expr = expr;
    this.values = values;
  }
}
