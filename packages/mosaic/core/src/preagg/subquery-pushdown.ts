import { ColumnNameRefNode, FromClauseNode, JoinNode, SelectClauseNode, TableRefNode, isAggregateExpression, isPivotQuery, isSelectQuery, isSetOperation, literal, type ExprNode, type PivotQuery, type Query, type SelectQuery, type SQLNode, type SetOperation, isTableRef } from '@uwdata/mosaic-sql';
import { isStar, isWildcard, nameEquals, queryScope, resolveRelation, starExpression, suffixEquals, tableEquals, type Scope } from './lineage.js';

/**
 * Push selected columns down to subqueries, ensuring they are included as
 * group by dimensions for aggregate expressions. This method mutates
 * the input query, modifying query SELECT and GROUP BY clauses.
 * @param query The query to push down to.
 * @param source The source relation (base table) containing the selected columns
 * @param cols The column names to push down.
 * @returns False if the columns could not be pushed down, in which case
 *  the query may be left in an invalid state.
 */
export function subqueryPushdown(query: Query, source: TableRefNode, cols: string[]): boolean {
  const memo = new Map<Query, boolean>();
  let supported = true;

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

  const visitFrom = (node: SQLNode, scope: Scope, relations: Relation[]): void => {
    if (node instanceof JoinNode) {
      visitFrom(node.left, scope, relations);
      visitFrom(node.right, scope, relations);
    } else {
      relations.push({ path: relationPath(node), source: visitRelation(node, scope) });
    }
  };

  const fromRelations = (q: SelectQuery, scope: Scope): Relation[] => {
    const relations: Relation[] = [];
    q._from.forEach(node => visitFrom(node, scope, relations));
    return relations;
  };

  const sourcePaths = (relations: Relation[]) =>
    relations.filter(r => r.source).map(r => r.path);

  const visitSelect = (q: SelectQuery, scope: Scope, append?: string[]): boolean => {
    const relations = fromRelations(q, scope);
    const paths = sourcePaths(relations);
    if (!paths.length) return false;
    const path = relations.length > 1 && paths.length === 1 ? paths[0] : undefined;
    const ref = (c: string) => new ColumnNameRefNode(c, path && new TableRefNode(path));
    if (!append) {
      appendSelect(q, missingSelect(q, paths).map(c => [c, ref(c)]));
    } else if (!q._select.some(isWildcard)) {
      appendSelect(q, append.map(c => [c, ref(c)]));
    } else if (append.length) {
      supported = false;
    }
    if (isAggregateQuery(q)) {
      q.groupby(cols.map(ref).filter(c => !hasColumn(q._groupby, c)));
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
      q.groupby(cols.filter(c => !hasColumn(q._groupby, new ColumnNameRefNode(c))));
    }
    return true;
  };

  const padNull = (q: Query, append: string[]): void => {
    if (isSelectQuery(q)) {
      if (append.length && q._select.some(isWildcard)) supported = false;
      appendSelect(q, append.map(c => [c, literal(null)]));
    } else if (isSetOperation(q)) {
      q.queries.forEach(sub => padNull(sub, append));
    }
  };

  const missing = (q: Query, outer: Scope): string[] => {
    const scope = queryScope(q, outer);
    if (isSelectQuery(q)) {
      const relations = fromRelations(q, scope);
      const paths = sourcePaths(relations);
      return missingSelect(q, paths.length ? paths : relations.map(r => r.path));
    }
    return isSetOperation(q) ? missing(q.queries[0], scope) : [];
  };

  const missingSelect = (q: SelectQuery, relations: (string[] | undefined)[]): string[] => {
    const result = cols.filter(c => !q._select.some(x => nameEquals(x.alias, c))
      && !starExpression(q, c, relations));
    if (!q._select.some(c => isWildcard(c) && !isStar(c))) return result;
    if (result.length && q !== query) supported = false;
    return [];
  };

  visitQuery(query, new Map());
  return supported;
}

interface Relation {
  path?: string[];
  source: boolean;
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

function relationPath(node: SQLNode): string[] | undefined {
  if (node instanceof FromClauseNode) {
    const { expr, alias, columnNames } = node;
    const implicit = isTableRef(expr) && !!alias && nameEquals(expr.name, alias) && !columnNames?.length;
    return alias && !implicit ? [alias] : relationPath(expr);
  }
  return isTableRef(node) ? node.table : undefined;
}

function hasColumn(list: SQLNode[], ref: ColumnNameRefNode): boolean {
  return list.some(x => x instanceof ColumnNameRefNode && nameEquals(x.name, ref.name)
    && (!x.table || !ref.table || suffixEquals(x.table.table, ref.table.table)));
}
