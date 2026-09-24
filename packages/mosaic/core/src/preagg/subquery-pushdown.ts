import { ColumnNameRefNode, JoinNode, isAggregateExpression, isPivotQuery, isSelectQuery, isSetOperation, literal, type TableRefNode, type LiteralNode, type PivotQuery, type Query, type SelectQuery, type SQLNode, type SetOperation, isTableRef } from "@uwdata/mosaic-sql";
import { isStar, queryScope, resolveRelation, tableEquals, type Scope } from "./lineage.js";

/**
 * Push selected columns down to subqueries, ensuring they are included as
 * group by dimensions for aggregate expressions. This method mutates
 * the input query, modifying query SELECT and GROUP BY clauses.
 * @param query The query to push down to.
 * @param source The source relation (base table) containing the selected columns
 * @param cols The column names to push down.
 */
export function subqueryPushdown(query: Query, source: TableRefNode, cols: string[]): void {
  const memo = new Map<Query, boolean>();

  const visitQuery = (q: Query, outer: Scope): boolean => {
    if (memo.has(q)) return memo.get(q)!;
    memo.set(q, false);
    const scope = queryScope(q, outer);
    let result = false;
    if (isSelectQuery(q)) {
      result = visitSelect(q, scope);
    } else if (isSetOperation(q)) {
      result = visitSetOperation(q, scope);
    } else if (isPivotQuery(q)) {
      result = visitPivot(q, scope);
    }
    memo.set(q, result);
    return result;
  };

  const visitRelation = (node: SQLNode, scope: Scope): boolean => {
    const rel = resolveRelation(node, scope);
    if (isTableRef(rel)) return tableEquals(rel, source);
    return rel ? visitQuery(rel.query, rel.scope) : false;
  };

  const visitFrom = (node: SQLNode, scope: Scope): boolean => {
    if (node instanceof JoinNode) {
      const left = visitFrom(node.left, scope);
      const right = visitFrom(node.right, scope);
      return left || right;
    }
    return visitRelation(node, scope);
  };

  const visitSelect = (q: SelectQuery, scope: Scope): boolean => {
    const found = q._from
      .map(node => visitFrom(node, scope))
      .some(x => x);
    if (!found) return false;
    if (!q._select.some(isStar)) {
      const selected = new Set(q._select.map(x => x.alias));
      q.select(cols.filter(c => !selected.has(c)));
    }
    if (isAggregateQuery(q)) {
      q.groupby(cols.filter(c => !hasColumn(q._groupby, c)));
    }
    return true;
  };

  const visitSetOperation = (q: SetOperation, scope: Scope): boolean => {
    const found = q.queries.map(sub => visitQuery(sub, scope));
    if (!found.some(x => x)) return false;
    // set operation inputs must have matching arity
    q.queries.forEach((sub, i) => { if (!found[i]) padNull(sub); });
    return true;
  };

  const visitPivot = (q: PivotQuery, scope: Scope): boolean => {
    if (!visitRelation(q.source, scope)) return false;
    // a pivot without GROUP BY implicitly groups by all remaining columns
    if (q._groupby.length) {
      q.groupby(cols.filter(c => !hasColumn(q._groupby, c)));
    }
    return true;
  };

  const padNull = (q: Query): void => {
    if (isSelectQuery(q)) {
      const selected = new Set(q._select.map(x => x.alias));
      const padding = cols.filter(c => !selected.has(c)).map(c => [c, literal(null)]);
      q.select(padding as [string, LiteralNode][]);
    } else if (isSetOperation(q)) {
      q.queries.forEach(padNull);
    }
  };

  visitQuery(query, new Map());
}

/**
 * Test if a query performs aggregation.
 * @param query Select query to test.
 * @returns True if query performs aggregation.
 */
function isAggregateQuery(query: SelectQuery): boolean {
  return query._groupby.length > 0
    || query._select.some(node => isAggregateExpression(node));
}

function hasColumn(list: SQLNode[], name: string): boolean {
  return list.some(x => x instanceof ColumnNameRefNode && x.name === name);
}
