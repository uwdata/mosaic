import { SCALAR_SUBQUERY } from '../constants.js';
import type { FilterExpr } from '../types.js';
import { FromClauseNode } from '../ast/from.js';
import { isSelectQuery, type Query } from '../ast/query.js';
import { isTableRef, type TableRefNode } from '../ast/table-ref.js';
import { asTableRef } from '../util/ast.js';
import { deepClone } from '../visit/clone.js';
import { walk } from '../visit/walk.js';

/**
 * Perform filter pushdown on a query: clones the given query and adds a
 * WHERE clause for the specified base table. Ignores scalar subqueries,
 * but will recurse into CTEs, joins, and other subqueries.
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
  const tableRef = asTableRef(table);
  if (tableRef) {
    walk(clone, (node) => {
      if (node.type === SCALAR_SUBQUERY) {
        return 1; // don't recurse
      } else if (isSelectQuery(node)) {
        for (const source of node._from) {
          if (source instanceof FromClauseNode &&
            isTableRef(source.expr) &&
            arrayEquals(source.expr.table, tableRef.table)
          ) {
            node.where(filter);
          }
        }
      }
    });
  }
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
