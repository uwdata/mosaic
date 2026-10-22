import { CAST } from '../constants.js';
import { ExprNode } from './node.js';

export class CastNode extends ExprNode {
  /** The expression to type cast. */
  readonly expr: ExprNode;
  /** The type to cast to. */
  readonly cast: string;
  /** Flag indicating a TRY_CAST that returns NULL on failure. */
  readonly isTry: boolean;

  /**
   * Instantiate a cast node.
   * @param expr The expression to type cast.
   * @param type The type to cast to.
   * @param isTry Flag indicating a TRY_CAST that returns NULL on failure.
   */
  constructor(expr: ExprNode, type: string, isTry: boolean = false) {
    super(CAST);
    this.expr = expr;
    this.cast = type;
    this.isTry = isTry;
  }
}
