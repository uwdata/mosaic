/**
 * @import { ParamLike } from '../types.js'
 */
import { PARAM } from '../constants.js';
import { literalToSQL } from './literal.js';
import { ExprNode } from './node.js';

export class ParamNode extends ExprNode {
  /**
   * Instantiate a param node with a dynamic parameter.
   * @param {ParamLike} param The dynamic parameter.
   */
  constructor(param) {
    super(PARAM);
    /**
     * The dynamic parameter.
     * @type {ParamLike}
     * @readonly
     */
    this.param = param;
  }

  /**
   * Returns the current parameter value.
   * @returns {*}
   */
  get value() {
    return this.param.value;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return literalToSQL(this.value);
  }
}
