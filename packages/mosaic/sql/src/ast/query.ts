import type { FilterExpr, FromExpr, GroupByExpr, MaybeArray, OrderByExpr, SelectExpr, WithExpr } from '../types.js';
import type { SampleMethod } from './sample.js';
import { DESCRIBE_QUERY, SELECT_QUERY, SET_OPERATION } from '../constants.js';
import { asNode, asVerbatim, maybeTableRef } from '../util/ast.js';
import { exprList, nodeList } from '../util/function.js';
import { unquote } from '../util/string.js';
import { isArray, isString } from '../util/type-check.js';
import { isColumnRef } from './column-ref.js';
import { FromClauseNode } from './from.js';
import { ExprNode, SQLNode, isNode } from './node.js';
import { SampleClauseNode } from './sample.js';
import { SelectClauseNode } from './select.js';
import { isTableRef } from './table-ref.js';
import { WindowClauseNode, type WindowDefNode } from './window.js';
import { WithClauseNode } from './with.js';

/**
 * Check if a value is a selection query or set operation.
 * @param value The value to check.
 */
export function isQuery(value: unknown): value is Query {
  return value instanceof Query;
}

/**
 * Check if a value is a selection query.
 * @param value The value to check.
 */
export function isSelectQuery(value: unknown): value is SelectQuery {
  return value instanceof SelectQuery;
}

/**
 * Check if a value is a describe query.
 * @param value The value to check.
 */
export function isDescribeQuery(value: unknown): value is DescribeQuery {
  return value instanceof DescribeQuery;
}

export class Query extends ExprNode {
  /**
   * Create a new WITH clause with the given CTE queries.
   * @param expr The WITH CTE queries.
   */
  static with(...expr: WithExpr[]) {
    return new WithClause(...expr);
  }

  /**
   * Create a new select query with the given SELECT expressions.
   * @param expr The SELECT expressions.
   */
  static select(...expr: SelectExpr[]) {
    return new SelectQuery().select(...expr);
  }

  /**
   * Create a new select query with the given FROM expressions.
   * @param expr The FROM expressions.
   */
  static from(...expr: FromExpr[]) {
    return new SelectQuery().from(...expr);
  }

  /**
   * Create a new UNION set operation over the given queries.
   * @param queries The queries.
   */
  static union(...queries: MaybeArray<Query>[]) {
    return new SetOperation('UNION', queries.flat());
  }

  /**
   * Create a new UNION BY NAME set operation over the given queries.
   * @param queries The queries.
   */
  static unionByName(...queries: MaybeArray<Query>[]) {
    return new SetOperation('UNION BY NAME', queries.flat());
  }

  /**
   * Create a new UNION ALL set operation over the given queries.
   * @param queries The queries.
   */
  static unionAll(...queries: MaybeArray<Query>[]) {
    return new SetOperation('UNION ALL', queries.flat());
  }

  /**
   * Create a new UNION ALL BY NAME set operation over the given queries.
   * @param queries The queries.
   */
  static unionAllByName(...queries: MaybeArray<Query>[]) {
    return new SetOperation('UNION ALL BY NAME', queries.flat());
  }

  /**
   * Create a new INTERSECT set operation over the given queries.
   * @param queries The queries.
   */
  static intersect(...queries: MaybeArray<Query>[]) {
    return new SetOperation('INTERSECT', queries.flat());
  }

  /**
   * Create a new INTERSECT ALL set operation over the given queries.
   * @param queries The queries.
   */
  static intersectAll(...queries: MaybeArray<Query>[]) {
    return new SetOperation('INTERSECT ALL', queries.flat());
  }

  /**
   * Create a new EXCEPT set operation over the given queries.
   * @param queries The queries.
   */
  static except(...queries: MaybeArray<Query>[]) {
    return new SetOperation('EXCEPT', queries.flat());
  }

  /**
   * Create a new EXCEPT ALL set operation over the given queries.
   * @param queries The queries.
   */
  static exceptAll(...queries: MaybeArray<Query>[]) {
    return new SetOperation('EXCEPT ALL', queries.flat());
  }

  /**
   * Create a new describe query for the given input query.
   * @param query The query to describe.
   */
  static describe(query: Query) {
    return new DescribeQuery(query);
  }

  _with: WithClauseNode[] = [];
  _orderby: ExprNode[] = [];
  _limitPerc: boolean = false;
  _limit?: ExprNode;
  _offset?: ExprNode;
  cteFor?: Query | null = null;

  /**
   * Instantiate a new query.
   */
  constructor(type: string) {
    super(type);
  }

  /**
   * Return a list of subqueries.
   */
  get subqueries(): Query[] {
    return [];
  }

  /**
   * Clone this query.
   */
  clone(): this {
    return this;
  }

  /**
   * Add a pointer to the query for which this query is a CTE.
   * @param query The query for which this query is a CTE.
   */
  setCteFor(query: Query | null): void {
    this.cteFor = query;
  }

  /**
   * Add WITH common table expressions (CTEs).
   * @param expr Expressions to add.
   */
  with(...expr: WithExpr[]): this {
    const list: WithClauseNode[] = [];
    const add = (name: string, q: Query) => {
      const query = q.clone();
      query.setCteFor(this);
      list.push(new WithClauseNode(name, query));
    };
    expr.flat().forEach(e => {
      if (e instanceof WithClauseNode) list.push(e);
      else if (e != null) for (const name in e) add(name, e[name]);
    });
    this._with = this._with.concat(list);
    return this;
  }

  /**
   * Add ORDER BY expressions.
   * @param expr Expressions to add.
   */
  orderby(...expr: OrderByExpr[]): this {
    this._orderby = this._orderby.concat(nodeList(expr));
    return this;
  }

  /**
   * Set the query result LIMIT as a percentage value.
   * @param value The limit percentage value.
   */
  limitPercent(value: number | ExprNode): this {
    this._limitPerc = true;
    this._limit = asNode(value);
    return this;
  }

  /**
   * Set the query result LIMIT.
   * @param value The limit value.
   */
  limit(value: number | ExprNode): this {
    this._limitPerc = false;
    this._limit = asNode(value);
    return this;
  }

  /**
   * Set the query result OFFSET.
   * @param value The offset value.
   */
  offset(value: number | ExprNode): this {
    this._offset = asNode(value);
    return this;
  }
}

export class SelectQuery extends Query {
  _select: SelectClauseNode[] = [];
  _from: FromClauseNode[] = [];
  _where: ExprNode[] = [];
  _sample?: SampleClauseNode;
  _groupby: ExprNode[] = [];
  _having: ExprNode[] = [];
  _window: WindowClauseNode[] = [];
  _qualify: ExprNode[] = [];
  _distinct: boolean = false;

  /**
   * Instantiate a new select query.
   */
  constructor() {
    super(SELECT_QUERY);
  }

  /**
   * Return a list of subqueries.
   */
  get subqueries(): Query[] {
    // build map of ctes within base query WITH clause
    const q = this.cteFor || this;
    const w = q instanceof SelectQuery ? q._with : [];
    const cte = w.reduce(
      (obj, c) => (obj[c.name] = c.query, obj),
      {} as Record<string, Query>
    );

    // extract subqueries in FROM clause
    // unused CTEs will be ignored
    const queries: Query[] = [];
    this._from.forEach(({ expr }) => {
      if (isQuery(expr)) {
        queries.push(expr);
      } else if (isTableRef(expr)) {
        const subq = cte[expr.name];
        if (subq) queries.push(subq);
      }
    });
    return queries;
  }

  /**
   * Clone this query.
   */
  clone(): this {
    return Object.assign(new SelectQuery(), this);
  }

  /**
   * Add SELECT expressions.
   * @param expr Expressions to add.
   */
  select(...expr: SelectExpr[]): this {
    const keys: Set<string> = new Set;
    const list: SelectClauseNode[] = [];

    const add = (v: unknown, as: string) => {
      const key = unquote(as)!;
      keys.add(key);
      if (v) list.push(new SelectClauseNode(asNode(v), key));
    };

    expr.flat().forEach(e => {
      if (e == null) return;
      else if (isString(e)) add(e, e);
      else if (isColumnRef(e)) add(e, e.column);
      else if (isArray(e)) add(e[1], e[0]);
      else if (isNode(e)) add(e, `${e}`);
      else for (const alias in e) add(e[alias], alias);
    });

    this._select = this._select.filter(x => !keys.has(x.alias)).concat(list);
    return this;
  }

  /**
   * Set SELECT expressions, replacing any prior expressions.
   * @param expr Expressions to add.
   */
  setSelect(...expr: SelectExpr[]): this {
    this._select = [];
    return this.select(...expr);
  }

  /**
   * Indicate if this query should retrieve distinct values only.
   * @param value The distinct flag
   */
  distinct(value: boolean = true): this {
    this._distinct = !!value;
    return this;
  }

  /**
   * Add table FROM expressions.
   * @param expr Expressions to add.
   */
  from(...expr: FromExpr[]): this {
    const list: FromClauseNode[] = [];

    const add = (v: string | string[] | SQLNode, as?: string) => {
      list.push(new FromClauseNode(maybeTableRef(v), unquote(as)));
    };

    expr.flat().forEach(e => {
      if (e == null) return;
      else if (e instanceof FromClauseNode) list.push(e);
      else if (isString(e)) add(e, e);
      else if (isTableRef(e)) add(e, e.name);
      else if (isNode(e)) add(e);
      else if (isArray(e)) add(e[1], e[0]);
      else for (const alias in e) add(e[alias], alias);
    });
    this._from = this._from.concat(list);
    return this;
  }

  /**
   * Set FROM expressions, replacing any prior expressions.
   * @param expr Expressions to add.
   */
  setFrom(...expr: FromExpr[]): this {
    this._from = [];
    return this.from(...expr);
  }

  /**
   * Set SAMPLE settings.
   * @param value Either a sample clause node or the sample size as either
   *  a row count or percentage.
   * @param method The sampling method to use.
   * @param seed The random seed.
   */
  sample(
    value: number | SampleClauseNode,
    method?: SampleMethod,
    seed?: number
  ): this {
    let clause;
    if (typeof value === 'number') {
      const perc = value > 0 && value < 1;
      const size = perc ? value * 100 : Math.floor(value);
      clause = new SampleClauseNode(size, perc, method, seed);
    } else {
      clause = value;
    }
    this._sample = clause;
    return this;
  }

  /**
   * Add WHERE expressions.
   * @param expr Expressions to add.
   */
  where(...expr: FilterExpr[]): this {
    this._where = this._where.concat(exprList(expr, asVerbatim));
    return this;
  }

  /**
   * Set WHERE expressions, replacing any prior expressions.
   * @param expr Expressions to add.
   */
  setWhere(...expr: FilterExpr[]): this {
    this._where = [];
    return this.where(...expr);
  }

  /**
   * Add GROUP BY expressions.
   * @param expr Expressions to add.
   */
  groupby(...expr: GroupByExpr[]): this {
    this._groupby = this._groupby.concat(nodeList(expr));
    return this;
  }

  /**
   * Set GROUP BY expressions, replacing any prior expressions.
   * @param expr Expressions to add.
   */
  setGroupby(...expr: GroupByExpr[]): this {
    this._groupby = [];
    return this.groupby(...expr);
  }

  /**
   * Add HAVING expressions.
   * @param expr Expressions to add.
   */
  having(...expr: FilterExpr[]): this {
    this._having = this._having.concat(exprList(expr, asVerbatim));
    return this;
  }

  /**
   * Add WINDOW definitions.
   * @param expr Window definitions to add.
   */
  window(...expr: (Record<string, WindowDefNode> | null)[]): this {
    const list: WindowClauseNode[] = [];
    expr.flat().forEach(e => {
      if (e != null) for (const name in e) {
        list.push(new WindowClauseNode(unquote(name)!, e[name]));
      }
    });
    this._window = this._window.concat(list);
    return this;
  }

  /**
   * Add QUALIFY expressions.
   * @param expr Expressions to add.
   */
  qualify(...expr: FilterExpr[]): this {
    this._qualify = this._qualify.concat(exprList(expr, asVerbatim));
    return this;
  }

  /**
   * Generate a SQL query string.
   */
  toString() {
    const {
      _with, _select, _distinct, _from, _sample, _where, _groupby,
      _having, _window, _qualify, _orderby, _limitPerc, _limit, _offset
    } = this;
    const sql = [];

    // WITH
    if (_with.length) sql.push(`WITH ${_with.join(', ')}`);

    // SELECT
    sql.push(`SELECT${_distinct ? ' DISTINCT' : ''} ${_select.join(', ')}`);

    // FROM
    if (_from.length) sql.push(`FROM ${_from.join(', ')}`);

    // WHERE
    if (_where.length) {
      const clauses = _where.map(String).filter(x => x).join(' AND ');
      if (clauses) sql.push(`WHERE ${clauses}`);
    }

    // SAMPLE
    if (_sample) sql.push(`USING SAMPLE ${_sample}`);

    // GROUP BY
    if (_groupby.length) {
      sql.push(`GROUP BY ${_groupby.join(', ')}`);
    }

    // HAVING
    if (_having.length) {
      const clauses = _having.map(String).filter(x => x).join(' AND ');
      if (clauses) sql.push(`HAVING ${clauses}`);
    }

    // WINDOW
    if (_window.length) sql.push(`WINDOW ${_window.join(', ')}`);

    // QUALIFY
    if (_qualify.length) {
      const clauses = _qualify.map(String).filter(x => x).join(' AND ');
      if (clauses) sql.push(`QUALIFY ${clauses}`);
    }

    // ORDER BY
    if (_orderby.length) sql.push(`ORDER BY ${_orderby.join(', ')}`);

    // LIMIT
    if (_limit) sql.push(`LIMIT ${_limit}${_limitPerc ? '%' : ''}`);

    // OFFSET
    if (_offset) sql.push(`OFFSET ${_offset}`);

    return sql.join(' ');
  }
}

export class DescribeQuery extends SQLNode {
  readonly query: Query;

  /**
   * Instantiate a describe query.
   * @param query The query to describe.
   */
  constructor(query: Query) {
    super(DESCRIBE_QUERY);
    this.query = query;
  }

  /**
   * Clone this describe query.
   */
  clone(): this {
    // @ts-expect-error creates describe query
    return new DescribeQuery(this.query.clone());
  }

  /**
   * Generate a SQL query string.
   */
  toString() {
    return `DESCRIBE ${this.query}`;
  }
}

export class SetOperation extends Query {
  /** The set operation to perform. */
  readonly op: string;
  /** The input queries to the set operation. */
  readonly queries: Query[];

  /**
   * Instantiate a new set operation instance.
   * @param op The set operation.
   * @param queries The subqueries.
   */
  constructor(op: string, queries: Query[]) {
    super(SET_OPERATION);
    this.op = op;
    this.queries = queries;
  }

  /**
   * Add a pointer to the query for which this query is a CTE.
   * @param query The query for which this query is a CTE.
   */
  setCteFor(query: Query | null) {
    super.setCteFor(query);
    const { queries, cteFor } = this;
    if (cteFor) queries.forEach(q => q.setCteFor(cteFor));
  }

  /**
   * Return a list of subqueries.
   */
  get subqueries() {
    return this.queries;
  }

  /**
   * Clone this set operation.
   */
  clone(): this {
    const { op, queries, ...rest } = this;
    // @ts-expect-error creates set operation
    return Object.assign(new SetOperation(op, queries), rest);
  }

  /**
   * Generate a SQL query string.
   */
  toString() {
    const { op, queries, _with, _orderby, _limitPerc, _limit, _offset } = this;
    const sql = [];

    // WITH
    if (_with.length) sql.push(`WITH ${_with.join(', ')}`);

    // SUBQUERIES
    sql.push(queries.join(` ${op} `));

    // ORDER BY
    if (_orderby.length) sql.push(`ORDER BY ${_orderby.join(', ')}`);

    // LIMIT
    if (_limit) sql.push(`LIMIT ${_limit}${_limitPerc ? '%' : ''}`);

    // OFFSET
    if (_offset) sql.push(`OFFSET ${_offset}`);

    return sql.join(' ');
  }
}

class WithClause {
  /** The common table expressions (CTE). */
  readonly _with: WithExpr[];

  /**
   * Instantiate a new WITH clause instance.
   * @param expr The WITH CTE queries.
   */
  constructor(...expr: WithExpr[]) {
    this._with = expr;
  }

  /**
   * Create a new select query with the given SELECT expressions.
   * @param expr The SELECT expressions.
   */
  select(...expr: SelectExpr[]) {
    return Query.select(...expr).with(...this._with);
  }

  /**
   * Create a new select query with the given FROM expressions.
   * @param expr The FROM expressions.
   */
  from(...expr: FromExpr[]) {
    return Query.from(...expr).with(...this._with);
  }

  /**
   * Create a new UNION set operation over the given queries.
   * @param queries The queries.
   */
  union(...queries: Query[]) {
    return Query.union(...queries).with(...this._with);
  }

  /**
   * Create a new UNION BY NAME set operation over the given queries.
   * @param queries The queries.
   */
  unionByName(...queries: Query[]) {
    return Query.unionByName(...queries).with(...this._with);
  }

  /**
   * Create a new UNION ALL set operation over the given queries.
   * @param queries The queries.
   */
  unionAll(...queries: Query[]) {
    return Query.unionAll(...queries).with(...this._with);
  }

  /**
   * Create a new UNION ALL BY NAME set operation over the given queries.
   * @param queries The queries.
   */
  unionAllByName(...queries: Query[]) {
    return Query.unionAllByName(...queries).with(...this._with);
  }

  /**
   * Create a new INTERSECT set operation over the given queries.
   * @param queries The queries.
   */
  intersect(...queries: Query[]) {
    return Query.intersect(...queries).with(...this._with);
  }

  /**
   * Create a new INTERSECT ALL set operation over the given queries.
   * @param queries The queries.
   */
  intersectAll(...queries: Query[]) {
    return Query.intersectAll(...queries).with(...this._with);
  }

  /**
   * Create a new EXCEPT set operation over the given queries.
   * @param queries The queries.
   */
  except(...queries: Query[]) {
    return Query.except(...queries).with(...this._with);
  }

  /**
   * Create a new EXCEPT ALL set operation over the given queries.
   * @param queries The queries.
   */
  exceptAll(...queries: Query[]) {
    return Query.exceptAll(...queries).with(...this._with);
  }
}
