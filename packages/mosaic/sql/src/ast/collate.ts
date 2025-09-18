import { COLLATE } from '../constants.js';
import { ExprNode } from './node.js';

export class CollateNode extends ExprNode {
  /** The expression to collate. */
  readonly expr: ExprNode;
  /** The collation type. */
  readonly collation: string;

  /**
   * Instantiate a collate node.
   * @param expr The expression to collate.
   * @param collation The collation type.
   */
  constructor(expr: ExprNode, collation: string) {
    super(COLLATE);
    this.expr = expr;
    this.collation = collation;
  }
}
