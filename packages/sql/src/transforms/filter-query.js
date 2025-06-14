/**
 * @import { Query } from '../ast/query.js'
 * @import { TableRefNode } from '../ast/table-ref.js'
 * @import { FilterExpr } from '../types.js'
 */
import { isSelectQuery } from '../ast/query.js';
import { isTableRef } from '../ast/table-ref.js';
import { deepClone } from '../visit/clone.js';
import { walk } from '../visit/walk.js';

/**
 * Returns a generator function that clones the given query and adds
 * a WHERE clause for the specified table reference.
 * @param {Query} query The query to clone and extend.
 * @param {TableRefNode} tableRef The table to filter.
 * @returns {(filter: FilterExpr) => Query} The generator function.
 */
export function filterQuery(query, tableRef) {
  return (filter) => {
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

function arrayEquals(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
