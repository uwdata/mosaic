import { SCALAR_SUBQUERY } from '../constants.js';
import type { FilterExpr } from '../types.js';
import { Query } from '../ast/query.js';
import { isTableRef, type TableRefNode } from '../ast/table-ref.js';
import { asTableRef } from '../util/ast.js';
import { deepClone } from '../visit/clone.js';
import { walk } from '../visit/walk.js';
import { WithClauseNode } from '../ast/with.js';

/**
 * Perform filter pushdown on a query: clone a query and push a filter into
 * the given base table via a CTE, so every reference to the table sees the
 * filtered rows. Skips scalar subqueries.
 * @param query The query to clone and extend.
 * @param table The base table as a table name or table reference node.
 * @param filter The filter predicate expression to add. May only reference
 *  columns of the table, not aliases assigned elsewhere in the query.
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

  // add filtered table as CTE node
  const cte = new WithClauseNode(
    filteredName,
    Query.select("*").from(tableRef).where(filter)
  );
  clone._with = [cte, ...clone._with];
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
