import { UNARY_OPERATOR, UNARY_POSTFIX_OPERATOR } from '../constants.js';
import { ExprNode } from './node.js';

class AbstractUnaryOpNode extends ExprNode {
  /** The operator type. */
  readonly op: string;
  /** The input expression. */
  readonly expr: ExprNode;

  /**
   * Instantiate an abstract unary operator node.
   * @param type The node type.
   * @param op The operator type.
   * @param expr The input expression.
   */
  constructor(type: string, op: string, expr: ExprNode) {
    super(type);
    this.op = op;
    this.expr = expr;
  }
}

export class UnaryOpNode extends AbstractUnaryOpNode {
  /**
   * Instantiate a unary operator node.
   * @param op The operator type.
   * @param expr The input expression.
   */
  constructor(op: string, expr: ExprNode) {
    super(UNARY_OPERATOR, op, expr);
  }


}

export class UnaryPostfixOpNode extends AbstractUnaryOpNode {
  /**
   * Instantiate a unary operator node.
   * @param op The operator type.
   * @param expr The input expression.
   */
  constructor(op: string, expr: ExprNode) {
    super(UNARY_POSTFIX_OPERATOR, op, expr);
  }


}
