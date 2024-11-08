import { FUNCTION } from '../constants.js';
import { ExprNode } from './node.js';

export class FunctionNode extends ExprNode {
  /**
   * Instantiate a function node.
   * @param {string} name The function name.
   * @param {ExprNode[]} [args=[]] The function arguments.
   */
  constructor(name, args = []) {
    super(FUNCTION);
    /**
     * The function name.
     * @type {string}
     * @readonly
     */
    this.name = name;
    /**
     * The function arguments.
     * @type {ExprNode[]}
     * @readonly
     */
    this.args = args;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const { name, args } = this;
    return `${name}(${args.join(', ')})`;
  }
}
