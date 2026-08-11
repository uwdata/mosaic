import { SCALAR_SUBQUERY } from '../constants.js';
import type { FilterExpr } from '../types.js';
import { ColumnRefNode } from '../ast/column-ref.js';
import { FromClauseNode } from '../ast/from.js';
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
 * @param table The base table as a table name or table reference node. The
 *  query is matched on the full table path, including any database or schema
 *  namespaces, so a query over `s.t1` is not filtered by a bare `t1`.
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

  // collect referenced table paths (to test for the filtered table) and
  // visible names (to avoid collisions with the filtered CTE name)
  const paths = new Set<string>();
  const names = new Set<string>();
  walk(clone, (node) => {
    if (isTableRef(node)) {
      paths.add(pathKey(node.table));
      names.add(node.name);
    }
  });
  if (!paths.has(pathKey(tableRef.table))) {
    // filtered table not present in query, nothing to do. This must match on
    // the full path, like the rewrite below: a query over "s"."t1" does not
    // reference a bare "t1", and vice versa.
    return clone;
  }
  let filteredName = `_${tableRef.name}`;
  while (names.has(filteredName)) {
    filteredName = `_${filteredName}`;
  }

  // rename table refs to the filtered CTE, keeping each source visible
  // under its original name so that column qualifiers still bind
  const visibleName = tableRef.name;
  walk(clone, (node, parent) => {
    if (node.type === SCALAR_SUBQUERY) {
      return 1; // don't recurse
    }
    if (!isTableRef(node) || !arrayEquals(node.table, tableRef.table)) {
      return; // not a reference to the filtered table
    }
    if (parent instanceof ColumnRefNode) {
      if (node.table.length > 1) {
        // a multi-part qualifier names a catalog location, which a CTE can
        // never occupy, so it can not be kept visible: rewrite it to the
        // visible name the filtered source is aliased to
        // @ts-expect-error set read-only property
        node.table = [visibleName];
      }
      return; // single-part qualifiers keep binding to the visible name
    }
    // @ts-expect-error set read-only property
    node.table = [filteredName];
    if (parent instanceof FromClauseNode && !parent.alias) {
      // @ts-expect-error set read-only property
      parent.alias = visibleName;
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

function pathKey(table: string[]) {
  return JSON.stringify(table);
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
