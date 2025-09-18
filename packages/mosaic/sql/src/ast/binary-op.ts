import { BINARY_OPERATOR } from '../constants.js';
import { ExprNode } from './node.js';

export class BinaryOpNode extends ExprNode {
  /** The operator type. */
  readonly op: string;
  /** The left input expression. */
  readonly left: ExprNode;
  /** The right input expression. */
  readonly right: ExprNode;

  /**
   * Instantiate a binary operator node.
   * @param op The operator type.
   * @param left The left input expression.
   * @param right The right input expression.
   */
  constructor(op: string, left: ExprNode, right: ExprNode) {
    super(BINARY_OPERATOR);
    this.op = op;
    this.left = left;
    this.right = right;
  }
}
