import { ColumnRefNode } from '../ast/column-ref.js';
import { TableRefNode } from '../ast/table-ref.js';
import { asTableRef } from '../util/ast.js';

/**
 * Create a column reference.
 * @param {string} name The column name.
 * @param {string | string[] | TableRefNode} [table] The table reference.
 * @returns {ColumnRefNode}
 */
export function column(name, table) {
  return new ColumnRefNode(name, asTableRef(table));
}
