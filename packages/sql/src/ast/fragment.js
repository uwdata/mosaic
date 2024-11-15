import { FRAGMENT } from '../constants.js';
import { ExprNode } from './node.js';

export class FragmentNode extends ExprNode {
  /**
   * Instantiate a fragment node with arbitrary content.
   * @param {ExprNode[]} spans The consecutive parts making up the fragment.
   */
  constructor(spans) {
    super(FRAGMENT);
    /**
     * The consecutive parts making up the fragment.
     * @type {ExprNode[]}
     * @readonly
     */
    this.spans = spans;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return this.spans.join('');
  }
}
