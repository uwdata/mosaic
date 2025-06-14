import { VERBATIM } from '../constants.js';
import { ExprNode } from './node.js';

export class VerbatimNode extends ExprNode {
  /**
   * Instantiate a raw node with verbatim content.
   * @param {string} value The verbatim content to include.
   * @param {string} [hint] A type hint for analyzing verbatim content.
   */
  constructor(value, hint) {
    super(VERBATIM);
    /**
     * The verbatim content to include.
     * @type {string}
     * @readonly
     */
    this.value = value;
    /**
     * A type hint for analyzing verbatim content.
     * @type {string}
     * @readonly
     */
    this.hint = hint;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return this.value;
  }
}
