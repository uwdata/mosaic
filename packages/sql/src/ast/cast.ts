import { CAST } from '../constants.js';
import { ExprNode } from './node.js';

export class CastNode extends ExprNode {
  /** The expression to type cast. */
  readonly expr: ExprNode;
  /** The type to cast to. */
  readonly cast: string;

  /**
   * Instantiate a cast node.
   * @param expr The expression to type cast.
   * @param type The type to cast to.
   */
  constructor(expr: ExprNode, type: string) {
    super(CAST);
    this.expr = expr;
    this.cast = type;
  }

  /**
   * Generate a SQL query string for this node.
   */
  toString() {
    // TODO? could include check to see if parens are necessary
    return `(${this.expr})::${this.cast}`;
  }
}
