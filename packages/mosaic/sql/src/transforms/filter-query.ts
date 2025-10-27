import type { FilterExpr } from '../types.js';
import { FromClauseNode } from '../ast/from.js';
import { isSelectQuery, type Query } from '../ast/query.js';
import { isTableRef, type TableRefNode } from '../ast/table-ref.js';
import { asTableRef } from '../util/ast.js';
import { deepClone } from '../visit/clone.js';
import { walk } from '../visit/walk.js';

/**
 * Perform filter pushdown on a query: clones the given query and adds a
 * WHERE clause for the specified base table.
 * @param query The query to clone and extend.
 * @param table The base table as a table name or table reference node.
 * @param filter The filter predicate expression to add.
 */
export function filterPushdown(
  query: Query,
  table: string | TableRefNode,
  filter: FilterExpr
) {
  const clone = deepClone(query);
  const tableRef = asTableRef(table)!;
  walk(clone, (node) => {
    if (
      isSelectQuery(node) &&
      node._from.length === 1 &&
      node._from[0] instanceof FromClauseNode &&
      isTableRef(node._from[0].expr) &&
      arrayEquals(node._from[0].expr.table, tableRef.table)
    ) {
      node.where(filter);
    }
  });
  return clone;
}

/**
 * Returns a generator function that clones the given query and adds
 * a WHERE clause for the specified base table.
 * @param query The query to clone and extend.
 * @param table The base table as a table name or table reference node.
 * @returns The generator function.
 */
export function filterQuery(query: Query, table: string | TableRefNode) {
  return (filter: FilterExpr) => filterPushdown(query, table, filter);
}

function arrayEquals(a: unknown[], b: unknown[]) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
