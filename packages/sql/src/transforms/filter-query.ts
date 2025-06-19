import type { FilterExpr } from '../types.js';
import { isSelectQuery, type Query } from '../ast/query.js';
import { isTableRef, type TableRefNode } from '../ast/table-ref.js';
import { deepClone } from '../visit/clone.js';
import { walk } from '../visit/walk.js';

/**
 * Returns a generator function that clones the given query and adds
 * a WHERE clause for the specified table reference.
 * @param query The query to clone and extend.
 * @param tableRef The table to filter.
 * @returns The generator function.
 */
export function filterQuery(query: Query, tableRef: TableRefNode) {
  return (filter: FilterExpr) => {
    const clone = deepClone(query);
    walk(clone, (node) => {
      if (
        isSelectQuery(node) &&
        node._from.length === 1 &&
        isTableRef(node._from[0].expr) &&
        arrayEquals(node._from[0].expr.table, tableRef.table)
      ) {
        node.where(filter);
      }
    });
    return clone;
  };
}

function arrayEquals(a: unknown[], b: unknown[]) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
