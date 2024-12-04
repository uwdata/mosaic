import { DESCRIBE_QUERY, SELECT_QUERY, SET_OPERATION } from '../constants.js';
import { asNode, asTableRef, asVerbatim } from '../util/ast.js';
import { exprList } from '../util/function.js';
import { unquote } from '../util/string.js';
import { isArray, isString } from '../util/type-check.js';
import { isColumnRef } from './column-ref.js';
import { FromClauseNode } from './from.js';
import { ExprNode, SQLNode, isNode } from './node.js';
import { SampleClauseNode } from './sample.js';
import { SelectClauseNode } from './select.js';
import { isTableRef } from './table-ref.js';
import { WindowClauseNode } from './window.js';
import { WithClauseNode } from './with.js';

/**
 * Check if a value is a selection query or set operation.
 * @param {*} value The value to check.
 * @returns {value is Query}
 */
export function isQuery(value) {
  return value instanceof Query;
}

/**
 * Check if a value is a selection query.
 * @param {*} value The value to check.
 * @returns {value is SelectQuery}
 */
export function isSelectQuery(value) {
  return value instanceof SelectQuery;
}

/**
 * Check if a value is a describe query.
 * @param {*} value The value to check.
 * @returns {value is DescribeQuery}
 */
export function isDescribeQuery(value) {
  return value instanceof DescribeQuery;
}

export class Query extends ExprNode {
  /**
   * Create a new select query with the given SELECT expressions.
   * @param {...import('../types.js').SelectExpr} expr The SELECT expressions.
   * @returns {SelectQuery}
   */
  static select(...expr) {
    return new SelectQuery().select(...expr);
  }

  /**
   * Create a new select query with the given FROM expressions.
   * @param {...import('../types.js').FromExpr} expr The FROM expressions.
   * @returns {SelectQuery}
   */
  static from(...expr) {
    return new SelectQuery().from(...expr);
  }

  /**
   * Create a new select query with the given WITH CTE queries.
   * @param {...import('../types.js').WithExpr} expr The WITH CTE queries.
   * @returns {SelectQuery}
   */
  static with(...expr) {
    return new SelectQuery().with(...expr);
  }

  /**
   * Create a new UNION set operation over the given queries.
   * @param {...Query} queries The queries.
   * @returns {SetOperation}
   */
  static union(...queries) {
    return new SetOperation('UNION', queries.flat());
  }

  /**
   * Create a new UNION ALL set operation over the given queries.
   * @param {...Query} queries The queries.
   * @returns {SetOperation}
   */
  static unionAll(...queries) {
    return new SetOperation('UNION ALL', queries.flat());
  }

  /**
   * Create a new INTERSECT set operation over the given queries.
   * @param {...Query} queries The queries.
   * @returns {SetOperation}
   */
  static intersect(...queries) {
    return new SetOperation('INTERSECT', queries.flat());
  }

  /**
   * Create a new EXCEPT set operation over the given queries.
   * @param {...Query} queries The queries.
   * @returns {SetOperation}
   */
  static except(...queries) {
    return new SetOperation('EXCEPT', queries.flat());
  }

  /**
   * Create a new describe query for the given input query.
   * @param {Query} query The query to describe.
   * @returns {DescribeQuery}
   */
  static describe(query) {
    return new DescribeQuery(query);
  }

  /**
   * Instantiate a new query.
   */
  constructor(type) {
    super(type);
    /** @type {ExprNode[]} */
    this._orderby = [];
    /** @type {number} */
    this._limit = undefined;
    /** @type {number} */
    this._offset = undefined;
    /** @type {Query | null} */
    this.cteFor = null;
  }

  /**
   * Return a list of subqueries.
   * @returns {Query[]}
   */
  get subqueries() {
    return [];
  }

  /**
   * Clone this query.
   * @returns {Query}
   */
  clone() {
    return this;
  }

  /**
   * Add ORDER BY expressions.
   * @param  {...import('../types.js').OrderByExpr} expr Expressions to add.
   * @returns
   */
  orderby(...expr) {
    this._orderby = this._orderby.concat(exprList(expr));
    return this;
  }

  /**
   * Set the query result LIMIT.
   * @param {number} value The limit value.
   * @returns {this}
   */
  limit(value) {
    this._limit = Number.isFinite(value) ? value : undefined;
    return this;
  }

  /**
   * Set the query result OFFSET.
   * @param {number} value The offset value.
   * @returns {this}
   */
  offset(value) {
    this._offset = Number.isFinite(value) ? value : undefined;
    return this;
  }
}

export class SelectQuery extends Query {
  /**
   * Instantiate a new select query.
   */
  constructor() {
    super(SELECT_QUERY);
    /** @type {WithClauseNode[]} */
    this._with = [];
    /** @type {SelectClauseNode[]} */
    this._select = [];
    /** @type {FromClauseNode[]} */
    this._from = [];
    /** @type {ExprNode[]} */
    this._where = [];
    /** @type {SampleClauseNode} */
    this._sample = undefined;
    /** @type {ExprNode[]} */
    this._groupby = [];
    /** @type {ExprNode[]} */
    this._having = [];
    /** @type {WindowClauseNode[]} */
    this._window = [];
    /** @type {ExprNode[]} */
    this._qualify = [];
  }

  /**
   * Return a list of subqueries.
   * @returns {Query[]}
   */
  get subqueries() {
    // build map of ctes within base query WITH clause
    const q = this.cteFor || this;
    const w = q instanceof SelectQuery ? q._with : [];
    const cte = w.reduce((obj, c) => (obj[c.name] = c.query, obj), {});

    // extract subqueries in FROM clause
    // unused CTEs will be ignored
    const queries = [];
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
   * @returns {SelectQuery}
   */
  clone() {
    return Object.assign(new SelectQuery(), this);
  }

  /**
   * Add WITH common table expressions (CTEs).
   * @param  {...import('../types.js').WithExpr} expr Expressions to add.
   * @returns {this}
   */
  with(...expr) {
    /** @type {WithClauseNode[]} */
    const list = [];
    const add = (name, q) => {
      const query = q.clone();
      query.cteFor = this;
      list.push(new WithClauseNode(name, query));
    };
    expr.flat().forEach(e => {
      if (e != null) for (const name in e) add(name, e[name]);
    });
    this._with = this._with.concat(list);
    return this;
  }

  /**
   * Add SELECT expressions.
   * @param {...import('../types.js').SelectExpr} expr Expressions to add.
   * @returns {this}
   */
  select(...expr) {
    /** @type {SelectClauseNode[]} */
    const list = [];
    const add = (v, as) => list.push(
      new SelectClauseNode(v == null ? v : asNode(v), unquote(as))
    );
    expr.flat().forEach(e => {
      if (e == null) return;
      else if (isString(e)) add(e, e);
      else if (isColumnRef(e)) add(e, e.column);
      else if (isArray(e)) add(e[1], e[0]);
      else for (const alias in e) add(e[alias], alias);
    });

    const keys = new Set(list.map(x => x.alias));
    this._select = this._select
      .filter(x => !keys.has(x.alias))
      .concat(list.filter(x => x.expr));
    return this;
  }

  /**
   * Set SELECT expressions, replacing any prior expressions.
   * @param {...import('../types.js').SelectExpr} expr Expressions to add.
   * @returns {this}
   */
  setSelect(...expr) {
    this._select = [];
    return this.select(...expr);
  }

  /**
   * Indicate if this query should retrieve distinct values only.
   * @param {boolean} value The distinct flag
   * @returns {this}
   */
  distinct(value = true) {
    this._distinct = !!value;
    return this;
  }

  /**
   * Add table FROM expressions.
   * @param  {...import('../types.js').FromExpr} expr Expressions to add.
   * @returns {this}
   */
  from(...expr) {
    const list = [];
    const add = (v, as) => list.push(new FromClauseNode(asTableRef(v), unquote(as)));
    expr.flat().forEach(e => {
      if (e == null) return;
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
   * @param {...import('../types.js').FromExpr} expr Expressions to add.
   * @returns {this}
   */
  setFrom(...expr) {
    this._from = [];
    return this.from(...expr);
  }

  /**
   * Set SAMPLE settings.
   * @param {number | SampleClauseNode} value Either a sample clause node
   *  or the sample size as either a row count or percentage.
   * @param {import('./sample.js').SampleMethod} [method] The sampling method
   *  to use.
   * @param {number} [seed] The random seed.
   * @returns {this}
   */
  sample(value, method, seed) {
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
   * @param  {...import('../types.js').FilterExpr} expr Expressions to add.
   * @returns {this}
   */
  where(...expr) {
    this._where = this._where.concat(exprList(expr, asVerbatim));
    return this;
  }

  /**
   * Set WHERE expressions, replacing any prior expressions.
   * @param {...import('../types.js').FilterExpr} expr Expressions to add.
   * @returns {this}
   */
  setWhere(...expr) {
    this._where = [];
    return this.where(...expr);
  }

  /**
   * Add GROUP BY expressions.
   * @param  {...import('../types.js').GroupByExpr} expr Expressions to add.
   * @returns {this}
   */
  groupby(...expr) {
    this._groupby = this._groupby.concat(exprList(expr));
    return this;
  }

  /**
   * Set GROUP BY expressions, replacing any prior expressions.
   * @param {...import('../types.js').GroupByExpr} expr Expressions to add.
   * @returns {this}
   */
  setGroupby(...expr) {
    this._groupby = [];
    return this.groupby(...expr);
  }

  /**
   * Add HAVING expressions.
   * @param {...import('../types.js').FilterExpr} expr Expressions to add.
   * @returns {this}
   */
  having(...expr) {
    this._having = this._having.concat(exprList(expr, asVerbatim));
    return this;
  }

  /**
   * Add WINDOW definitions.
   * @param  {...any} expr Expressions to add.
   * @returns {this}
   */
  window(...expr) {
    const list = [];
    expr.flat().forEach(e => {
      if (e != null) for (const name in e) {
        list.push(new WindowClauseNode(unquote(name), e[name]));
      }
    });
    this._window = this._window.concat(list);
    return this;
  }

  /**
   * Add QUALIFY expressions.
   * @param {...import('../types.js').FilterExpr} expr Expressions to add.
   * @returns {this}
   */
  qualify(...expr) {
    this._qualify = this._qualify.concat(exprList(expr, asVerbatim));
    return this;
  }

  /**
   * Generate a SQL query string.
   * @returns {string}
   */
  toString() {
    const {
      _with, _select, _distinct, _from, _sample, _where, _groupby,
      _having, _window, _qualify, _orderby, _limit, _offset
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
    if (Number.isFinite(_limit)) sql.push(`LIMIT ${_limit}`);

    // OFFSET
    if (Number.isFinite(_offset)) sql.push(`OFFSET ${_offset}`);

    return sql.join(' ');
  }
}

export class DescribeQuery extends SQLNode {
  /**
   * Instantiate a describe query.
   */
  constructor(query) {
    super(DESCRIBE_QUERY);
    this.query = query;
  }

  /**
   * Clone this describe query.
   * @returns {DescribeQuery}
   */
  clone() {
    return new DescribeQuery(this.query.clone());
  }

  /**
   * Generate a SQL query string.
   * @returns {string}
   */
  toString() {
    return `DESCRIBE ${this.query}`;
  }
}

export class SetOperation extends Query {
  /**
   * Instantiate a new set operation instance.
   * @param {string} op The set operation.
   * @param {Query[]} queries The subqueries.
   */
  constructor(op, queries) {
    super(SET_OPERATION);
    /**
     * @type {string}
     * @readonly
     */
    this.op = op;
    /**
     * @type {Query[]}
     * @readonly
     */
    this.queries = queries;
  }

  /**
   * Return a list of subqueries.
   * @returns {Query[]}
   */
  get subqueries() {
    const { queries, cteFor } = this;
    // TODO: revisit this?
    if (cteFor) queries.forEach(q => q.cteFor = cteFor);
    return queries;
  }

  /**
   * Clone this set operation.
   * @returns {SetOperation}
   */
  clone() {
    const { op, queries, ...rest } = this;
    return Object.assign(new SetOperation(op, queries), rest);
  }

  /**
   * Generate a SQL query string.
   * @returns {string}
   */
  toString() {
    const { op, queries, _orderby, _limit, _offset } = this;

    // SUBQUERIES
    const sql = [ queries.join(` ${op} `) ];

    // ORDER BY
    if (_orderby.length) sql.push(`ORDER BY ${_orderby.join(', ')}`);

    // LIMIT
    if (Number.isFinite(_limit)) sql.push(`LIMIT ${_limit}`);

    // OFFSET
    if (Number.isFinite(_offset)) sql.push(`OFFSET ${_offset}`);

    return sql.join(' ');
  }
}
