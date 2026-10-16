import { ColumnNameRefNode, FromClauseNode, JoinNode, SelectClauseNode, isAggregateExpression, isPivotQuery, isSelectQuery, isSetOperation, literal, type ExprNode, type TableRefNode, type PivotQuery, type Query, type SelectQuery, type SQLNode, type SetOperation, isTableRef } from '@uwdata/mosaic-sql';
import { isStar, isWildcard, queryScope, resolveRelation, starExpression, tableEquals, type Scope } from './lineage.js';

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

  const visitQuery = (q: Query, outer: Scope, append?: string[]): boolean => {
    if (memo.has(q)) return memo.get(q)!;
    memo.set(q, false);
    const scope = queryScope(q, outer);
    let result = false;
    if (isSelectQuery(q)) {
      result = visitSelect(q, scope, append);
    } else if (isSetOperation(q)) {
      result = visitSetOperation(q, scope, append);
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

  const visitFrom = (node: SQLNode, scope: Scope, relations: (string | undefined)[]): void => {
    if (node instanceof JoinNode) {
      visitFrom(node.left, scope, relations);
      visitFrom(node.right, scope, relations);
    } else if (visitRelation(node, scope)) {
      relations.push(relationName(node));
    }
  };

  const sourceRelations = (q: SelectQuery, scope: Scope): (string | undefined)[] => {
    const relations: (string | undefined)[] = [];
    q._from.forEach(node => visitFrom(node, scope, relations));
    return relations;
  };

  const visitSelect = (q: SelectQuery, scope: Scope, append?: string[]): boolean => {
    const relations = sourceRelations(q, scope);
    if (!relations.length) return false;
    if (!append) {
      appendSelect(q, missingSelect(q, relations).map(c => [c, new ColumnNameRefNode(c)]));
    } else if (!q._select.some(isWildcard)) {
      appendSelect(q, append.map(c => [c, new ColumnNameRefNode(c)]));
    }
    if (isAggregateQuery(q)) {
      q.groupby(cols.filter(c => !hasColumn(q._groupby, c)));
    }
    return true;
  };

  // set operation inputs take output names from the first input by
  // position, so all inputs must append the same columns in the same order
  const visitSetOperation = (q: SetOperation, scope: Scope, append = missing(q.queries[0], scope)): boolean => {
    const found = q.queries.map(sub => visitQuery(sub, scope, append));
    if (!found.some(x => x)) return false;
    q.queries.forEach((sub, i) => { if (!found[i]) padNull(sub, append); });
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

  const padNull = (q: Query, append: string[]): void => {
    if (isSelectQuery(q)) {
      appendSelect(q, append.map(c => [c, literal(null)]));
    } else if (isSetOperation(q)) {
      q.queries.forEach(sub => padNull(sub, append));
    }
  };

  const missing = (q: Query, outer: Scope): string[] => {
    const scope = queryScope(q, outer);
    if (isSelectQuery(q)) return missingSelect(q, sourceRelations(q, scope));
    return isSetOperation(q) ? missing(q.queries[0], scope) : [];
  };

  const missingSelect = (q: SelectQuery, relations: (string | undefined)[]): string[] => {
    if (q._select.some(c => isWildcard(c) && !isStar(c))) return [];
    const selected = new Set(q._select.map(x => x.alias));
    return cols.filter(c => !selected.has(c) && !starExpression(q, c, relations));
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

/**
 * Append select clauses without replacing existing clauses that share an
 * alias, as set operation inputs may reuse names that are positionally
 * assigned to different output columns.
 * @param query The select query to modify.
 * @param clauses The [alias, expression] pairs to append.
 */
function appendSelect(query: SelectQuery, clauses: [string, ExprNode][]): void {
  query._select.push(...clauses.map(([alias, expr]) => new SelectClauseNode(expr, alias)));
}

function relationName(node: SQLNode): string | undefined {
  if (node instanceof FromClauseNode) {
    return node.alias ?? (isTableRef(node.expr) ? node.expr.name : undefined);
  }
  return isTableRef(node) ? node.name : undefined;
}

function hasColumn(list: SQLNode[], name: string): boolean {
  return list.some(x => x instanceof ColumnNameRefNode && x.name === name);
}
