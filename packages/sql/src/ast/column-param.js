/**
 * @import { ParamNode } from './param.js'
 * @import { TableRefNode } from './table-ref.js'
 */
import { COLUMN_PARAM } from '../constants.js';
import { ColumnRefNode } from './column-ref.js';

/**
 * Check if a value is a dynamic column reference node.
 * @param {*} value The value to check.
 * @returns {value is ColumnParamNode}
 */
export function isColumnParam(value) {
  return value instanceof ColumnParamNode;
}

export class ColumnParamNode extends ColumnRefNode {
  /**
   * Instantiate a column param node.
   * @param {ParamNode} param The column name as a parameter node.
   * @param {TableRefNode} [table] The table reference.
   */
  constructor(param, table) {
    super(COLUMN_PARAM, table);
    /**
     * The column name as a parameter node.
     * @type {ParamNode}
     * @readonly
     */
    this.param = param;
  }

  /**
   * Returns the column name.
   * @returns {string}
   */
  get column() {
    return `${this.param.value}`;
  }
}
