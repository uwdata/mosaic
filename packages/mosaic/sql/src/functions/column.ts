import type { ColumnRefNode } from '../ast/column-ref.js';
import type { TableRefNode } from '../ast/table-ref.js';
import type { ParamLike } from '../types.js';
import { ColumnParamNode } from '../ast/column-param.js';
import { ColumnNameRefNode } from '../ast/column-ref.js';
import { ParamNode } from '../ast/param.js';
import { asTableRef } from '../util/ast.js';
import { isParamLike } from '../util/type-check.js';

/**
 * Create a column reference.
 * @param name The column name, as a string or as a dynamic parameter.
 * @param table The table reference.
 */
export function column(
  name: string | ParamLike,
  table?: string | string[] | TableRefNode
): ColumnRefNode {
  const tref = asTableRef(table);
  return isParamLike(name)
    ? new ColumnParamNode(new ParamNode(name), tref)
    : new ColumnNameRefNode(name, tref);
}
