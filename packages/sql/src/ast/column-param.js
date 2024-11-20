import { COLUMN_PARAM } from '../constants.js';
import { columnRefString } from './column-ref.js';
import { ExprNode } from './node.js';

export class ColumnParamNode extends ExprNode {
  /**
   * Instantiate a column param node.
   * @param {import('../types.js').ParamLike} param The column name as a parameter.
   * @param {import('./table-ref.js').TableRefNode} [table] The table reference.
   */
  constructor(param, table) {
    super(COLUMN_PARAM);
    /**
     * The column name as a parameter.
     * @type {import('../types.js').ParamLike}
     * @readonly
     */
    this.param = param;
    /**
     * The table reference.
     * @type {import('./table-ref.js').TableRefNode}
     * @readonly
     */
    this.table = table;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return columnRefString(this.param.value, this.table);
  }
}
