import { TUPLE } from '../constants.js';
import { ExprNode } from './node.js';

export class TupleNode extends ExprNode {
  /** The array of values. */
  readonly values: ExprNode[];

  /**
   * Instantiate a tuple node.
   * @param values
   */
  constructor(values: ExprNode[]) {
    super(TUPLE);
    this.values = values;
  }
}
