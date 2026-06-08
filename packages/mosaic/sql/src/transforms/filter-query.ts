import { SCALAR_SUBQUERY } from '../constants.js';
import type { FilterExpr } from '../types.js';
import { Query } from '../ast/query.js';
import { isTableRef, type TableRefNode } from '../ast/table-ref.js';
import { asTableRef } from '../util/ast.js';
import { deepClone } from '../visit/clone.js';
import { walk } from '../visit/walk.js';

/**
 * Perform filter pushdown on a query: clones the given query and adds a
 * WHERE clause for the specified base table. Ignores scalar subqueries,
 * but will recurse into CTEs, joins, and FROM subqueries.
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

  // early exit if no filter or no table to apply it to
  if (!tableRef || (Array.isArray(filter) && filter.length === 0)) {
    return clone;
  }

  // determine unique name for filtered CTE
  const names = new Set<string>();
  walk(clone, (node) => {
    if (isTableRef(node)) {
      names.add(node.name);
    }
  });
  if (!names.has(tableRef.name)) {
    // filtered table not present in query, nothing to do
    return clone;
  }
  let filteredName = `_${tableRef.name}`;
  while (names.has(filteredName)) {
    filteredName = `_${filteredName}`;
  }

  // rewrite table references to use filtered data
  walk(clone, (node) => {
    if (node.type === SCALAR_SUBQUERY) {
      return 1; // don't recurse
    } else if (isTableRef(node) && arrayEquals(node.table, tableRef.table)) {
      // @ts-expect-error set read-only property
      node.table = [filteredName];
    }
  });

  return clone.with({
    [filteredName]: Query.select("*").from(tableRef).where(filter)
  });
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
