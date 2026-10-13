import { ColumnNameRefNode, ColumnsNode, FromClauseNode, isAggregateExpression, isColumnRef, isPivotQuery, isQuery, isSelectQuery, isSetOperation, isTableRef, rewrite, ScalarSubqueryNode, StarNode, TableRefNode, walk, WindowNode, type ColumnRefNode, type ExprNode, type Query, type SelectQuery, type SQLNode } from '@uwdata/mosaic-sql';

/** A query paired with the scope of CTEs visible to it. */
export interface Binding {
  query: Query;
  scope: Scope;
}

/** A map from CTE names to their bound queries. */
export type Scope = Map<string, Binding>;

/**
 * Return the scope of CTEs visible within a query, extending an outer
 * scope with the query's own WITH clause. Each CTE is bound to the
 * scope defined by the CTEs that precede it.
 * @param query The query.
 * @param outer The scope visible outside the query.
 */
export function queryScope(query: Query, outer: Scope = new Map()): Scope {
  let scope = outer;
  for (const { name, query: cte } of query._with) {
    scope = new Map(scope).set(name, { query: cte, scope });
  }
  return scope;
}

/**
 * Resolve a relation (such as a FROM clause entry) to either a base
 * table reference or a bound query. Returns null for joins and other
 * relations, such as table functions or VALUES lists.
 * @param node The relation node.
 * @param scope The scope of visible CTEs.
 */
export function resolveRelation(node: SQLNode, scope: Scope): TableRefNode | Binding | null {
  if (node instanceof FromClauseNode) return resolveRelation(node.expr, scope);
  if (isQuery(node)) return { query: node, scope };
  if (isTableRef(node)) {
    return (node.table.length === 1 && scope.get(node.name)) || node;
  }
  return null;
}

/**
 * Determine the single base table from which a query derives its rows.
 * Returns null if the query draws from multiple tables, joins, or other
 * unsupported relations.
 * @param query The query.
 * @param outer The scope visible outside the query.
 */
export function baseTable(query: Query, outer: Scope = new Map()): TableRefNode | null {
  const scope = queryScope(query, outer);
  const tables = isSelectQuery(query)
    ? (query._from.length === 1 ? [relationBase(query._from[0], scope)] : [null])
    : isSetOperation(query) ? query.queries.map(q => baseTable(q, scope))
    : isPivotQuery(query) ? [relationBase(query.source, scope)]
    : [null];
  const [table] = tables;
  return table && tables.every(t => t && tableEquals(t, table)) ? table : null;
}

function relationBase(node: SQLNode, scope: Scope): TableRefNode | null {
  const rel = resolveRelation(node, scope);
  if (rel instanceof TableRefNode) return rel;
  return rel ? baseTable(rel.query, rel.scope) : null;
}

/**
 * Rewrite an expression over the FROM relation of a select query into an
 * equivalent expression over base table columns. Returns undefined if a
 * column can not be resolved to a non-aggregate, non-window expression.
 * @param query The select query whose FROM relation the expression uses.
 * @param expr The expression to rewrite.
 * @param outer The scope visible outside the query.
 */
export function baseExpression(
  query: SelectQuery,
  expr: ExprNode,
  outer: Scope = new Map()
): ExprNode | undefined {
  if (query._from.length !== 1) return;
  const rel = resolveRelation(query._from[0], queryScope(query, outer));
  if (!rel) return;
  if (rel instanceof TableRefNode) return expr;
  if (hasNode(expr, ColumnsNode)) return;
  const map = new Map<ExprNode, ExprNode>();
  for (const col of columnRefs(expr)) {
    const e = outputExpression(rel.query, col.column, rel.scope);
    if (!e) return;
    map.set(col, e);
  }
  return rewrite(expr, map);
}

function outputExpression(query: Query, name: string, outer: Scope): ExprNode | undefined {
  if (isSelectQuery(query)) {
    const clause = query._select.find(c => c.alias === name);
    const expr = clause?.expr ?? starExpression(query, name);
    return selectExpression(query, expr, outer);
  }
  if (isSetOperation(query)) {
    const index = outputNames(query)?.indexOf(name) ?? -1;
    if (index >= 0) return positionalExpression(query, index, outer);
  }
}

// set operation inputs after the first take output names by position
function positionalExpression(query: Query, index: number, outer: Scope): ExprNode | undefined {
  if (isSelectQuery(query)) {
    if (query._select.some(isWildcard)) return;
    return selectExpression(query, query._select[index]?.expr, outer);
  }
  if (isSetOperation(query)) {
    const scope = queryScope(query, outer);
    const exprs = query.queries.map(q => positionalExpression(q, index, scope));
    const [expr] = exprs;
    return expr && exprs.every(e => e && `${e}` === `${expr}`) ? expr : undefined;
  }
}

function selectExpression(query: SelectQuery, expr: ExprNode | undefined, outer: Scope): ExprNode | undefined {
  if (!expr || isAggregateExpression(expr) || hasNode(expr, WindowNode)) return;
  return baseExpression(query, expr, outer);
}

function outputNames(query: Query): string[] | undefined {
  if (isSelectQuery(query)) {
    return query._select.some(isWildcard) ? undefined : query._select.map(c => c.alias);
  }
  if (isSetOperation(query)) return outputNames(query.queries[0]);
}

function columnRefs(expr: ExprNode): ColumnRefNode[] {
  const refs: ColumnRefNode[] = [];
  walk(expr, node => {
    if (node instanceof ScalarSubqueryNode) return 1;
    if (isColumnRef(node)) refs.push(node);
  });
  return refs;
}

function hasNode(expr: SQLNode, type: typeof WindowNode | typeof ColumnsNode): boolean {
  let found = false;
  walk(expr, node => {
    if (node instanceof type) return (found = true, -1);
  });
  return found;
}

/**
 * Test if a select clause is an unqualified or qualified star (*).
 * @param node The select clause.
 */
export function isStar(node: { expr: SQLNode }): boolean {
  return node.expr instanceof ColumnNameRefNode && node.expr.name === '*';
}

/**
 * Test if a select clause may expand to multiple output columns, either
 * as a star (*) or by including a COLUMNS expression.
 * @param node The select clause.
 */
export function isWildcard(node: { expr: SQLNode }): boolean {
  return isStar(node) || hasNode(node.expr, ColumnsNode);
}

/**
 * Return the expression a select query's star clauses output for a
 * column name, or undefined if no star clause outputs the name.
 * @param query The select query.
 * @param name The output column name.
 */
export function starExpression(query: SelectQuery, name: string): ExprNode | undefined {
  for (const clause of query._select) {
    if (!isStar(clause)) continue;
    const { expr } = clause;
    if (!(expr instanceof StarNode)) return new ColumnNameRefNode(name);
    const replaced = expr.replace.find(c => c.alias === name);
    if (replaced) return replaced.expr;
    const renamed = expr.rename.find(([, to]) => to === name);
    if (renamed) return new ColumnNameRefNode(renamed[0]);
    const removed = expr.exclude.includes(name)
      || expr.rename.some(([from]) => from === name);
    if (!removed) return new ColumnNameRefNode(name);
  }
}

/**
 * Test if two table references refer to the same table.
 * @param a The first table reference.
 * @param b The second table reference.
 */
export function tableEquals(a: TableRefNode, b: TableRefNode): boolean {
  return a.table.length === b.table.length
    && a.table.every((v, i) => v === b.table[i]);
}
