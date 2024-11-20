import { ColumnParamNode } from '../ast/column-param.js';
import { ColumnRefNode } from '../ast/column-ref.js';
import { ParamNode } from '../ast/param.js';
import { TableRefNode } from '../ast/table-ref.js';
import { asTableRef } from '../util/ast.js';
import { isParamLike } from '../util/type-check.js';

/**
 * Create a column reference.
 * @param {string | import('../types.js').ParamLike} name The column name,
 *  as a string or as a dynamic parameter.
 * @param {string | string[] | TableRefNode} [table] The table reference.
 * @returns {ColumnRefNode}
 */
export function column(name, table) {
  const tref = asTableRef(table);
  return isParamLike(name)
    ? new ColumnParamNode(new ParamNode(name), tref)
    : new ColumnRefNode(name, tref);
}
