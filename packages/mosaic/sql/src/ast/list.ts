import { LIST } from '../constants.js';
import { ExprNode } from './node.js';

export class ListNode extends ExprNode {
  /** The array of values. */
  readonly values: ExprNode[];

  /**
   * Instantiate a list node.
   * @param values
   */
  constructor(values: ExprNode[]) {
    super(LIST);
    this.values = values;
  }

  /**
   * Generate a SQL query string for this node.
   */
  toString() {
    return `[${this.values.join(', ')}]`;
  }
}
