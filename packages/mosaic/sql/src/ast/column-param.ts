import type { ParamNode } from './param.js';
import type { TableRefNode } from './table-ref.js';
import { COLUMN_PARAM } from '../constants.js';
import { ColumnRefNode } from './column-ref.js';

/**
 * Check if a value is a dynamic column reference node.
 * @param value The value to check.
 */
export function isColumnParam(value: unknown): value is ColumnParamNode {
  return value instanceof ColumnParamNode;
}

export class ColumnParamNode extends ColumnRefNode {
  /** The column name as a parameter node */
  readonly param: ParamNode;

  /**
   * Instantiate a column param node.
   * @param param The column name as a parameter node.
   * @param table The table reference.
   */
  constructor(param: ParamNode, table?: TableRefNode) {
    super(COLUMN_PARAM, table);
    this.param = param;
  }

  /**
   * Returns the column name.
   */
  get column() {
    return `${this.param.value}`;
  }
}
