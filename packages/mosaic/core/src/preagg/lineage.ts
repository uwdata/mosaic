import { ColumnNameRefNode, FromClauseNode, isAggregateExpression, isColumnRef, isPivotQuery, isQuery, isSelectQuery, isSetOperation, isTableRef, rewrite, ScalarSubqueryNode, TableRefNode, walk, WindowNode, type ColumnRefNode, type ExprNode, type Query, type SelectQuery, type SQLNode } from '@uwdata/mosaic-sql';

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
    const expr = clause?.expr
      ?? (query._select.some(isStar) ? new ColumnNameRefNode(name) : undefined);
    if (!expr || isAggregateExpression(expr) || containsNode(expr, WindowNode)) return;
    return baseExpression(query, expr, outer);
  }
  if (isSetOperation(query)) {
    const scope = queryScope(query, outer);
    const exprs = query.queries.map(q => outputExpression(q, name, scope));
    const [expr] = exprs;
    return expr && exprs.every(e => e && `${e}` === `${expr}`) ? expr : undefined;
  }
}

function columnRefs(expr: ExprNode): ColumnRefNode[] {
  const refs: ColumnRefNode[] = [];
  walk(expr, node => {
    if (node instanceof ScalarSubqueryNode) return 1;
    if (isColumnRef(node)) refs.push(node);
  });
  return refs;
}

/**
 * Test if an expression contains a node of the given type.
 * @param expr The expression to test.
 * @param type The node class to search for.
 */
export function containsNode(expr: SQLNode, type: new (...args: never[]) => SQLNode): boolean {
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
 * Test if two table references refer to the same table.
 * @param a The first table reference.
 * @param b The second table reference.
 */
export function tableEquals(a: TableRefNode, b: TableRefNode): boolean {
  return a.table.length === b.table.length
    && a.table.every((v, i) => v === b.table[i]);
}
