import { SLICE, SUBSCRIPT } from '../constants.js';
import { ExprNode } from './node.js';

export class SubscriptNode extends ExprNode {
  /** The list, string, struct, or map expression to index into. */
  readonly expr: ExprNode;
  /** The index or key. */
  readonly index: ExprNode;

  /**
   * Instantiate a subscript node.
   * @param expr The expression to index into.
   * @param index The index or key.
   */
  constructor(expr: ExprNode, index: ExprNode) {
    super(SUBSCRIPT);
    this.expr = expr;
    this.index = index;
  }
}

export class SliceNode extends ExprNode {
  /** The list or string expression to slice. */
  readonly expr: ExprNode;
  /** The inclusive start index, or undefined to start at the beginning. */
  readonly start?: ExprNode;
  /** The inclusive end index, or undefined to continue to the end. */
  readonly end?: ExprNode;
  /** The step size, or undefined for the default step of 1. */
  readonly step?: ExprNode;

  /**
   * Instantiate a slice node.
   * @param expr The expression to slice.
   * @param start The inclusive start index.
   * @param end The inclusive end index.
   * @param step The step size.
   */
  constructor(expr: ExprNode, start?: ExprNode, end?: ExprNode, step?: ExprNode) {
    super(SLICE);
    this.expr = expr;
    this.start = start;
    this.end = end;
    this.step = step;
  }
}
