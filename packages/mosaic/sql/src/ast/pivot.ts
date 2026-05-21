import type { GroupByExpr, PivotInExpr, PivotOnExpr, PivotUsingEntry, PivotUsingExpr } from '../types.js';
import { PIVOT_QUERY } from '../constants.js';
import { asLiteral, asNode, maybeTableRef } from '../util/ast.js';
import { nodeList } from '../util/function.js';
import { unquote } from '../util/string.js';
import { isArray, isParamLike, isString } from '../util/type-check.js';
import { ExprNode, SQLNode, isNode } from './node.js';
import { Query, isQuery, setPivotQueryFactory } from './query.js';
import { SelectClauseNode } from './select.js';

export type PivotSource = string | string[] | SQLNode;

/**
 * Check if a value is a pivot query.
 * @param value The value to check.
 */
export function isPivotQuery(value: unknown): value is PivotQuery {
  return value instanceof PivotQuery;
}

export class PivotQuery extends Query {
  /** The relation to pivot. */
  readonly source: SQLNode;
  /** The expressions whose values determine pivot output columns. */
  _on: ExprNode[] = [];
  /** The literal values that constrain and order pivot output columns. */
  _in: ExprNode[] = [];
  /** The aggregate expressions used to populate pivot output cells. */
  _using: SelectClauseNode[] = [];
  /** The expressions that define pivot row groups. */
  _groupby: ExprNode[] = [];

  /**
   * Instantiate a new pivot query.
   * @param source The source relation to pivot.
   */
  constructor(source: PivotSource) {
    super(PIVOT_QUERY);
    this.source = maybeTableRef(source);
  }

  /**
   * Add a pointer to the query for which this query is a CTE.
   * @param query The query for which this query is a CTE.
   */
  setCteFor(query: Query | null): void {
    super.setCteFor(query);
    if (isQuery(this.source)) {
      this.source.setCteFor(query);
    }
  }

  /**
   * Return a list of subqueries.
   */
  get subqueries(): Query[] {
    return isQuery(this.source) ? [this.source] : [];
  }

  /**
   * Add ON expressions.
   * @param expr Expressions to add.
   */
  on(...expr: PivotOnExpr[]): this {
    this._on = this._on.concat(nodeList(expr));
    return this;
  }

  /**
   * Add IN values to constrain and order pivot output columns.
   * @param expr Values to add.
   */
  in(...expr: [PivotInExpr, ...PivotInExpr[]]): this {
    const list = expr.flat().map(asLiteral);
    if (list.length === 0) {
      throw new Error('PivotQuery.in requires at least one value.');
    }
    this._in = this._in.concat(list);
    return this;
  }

  /**
   * Add USING expressions.
   * @param expr Aggregate cell expressions to add.
   */
  using(...expr: [PivotUsingExpr, ...PivotUsingExpr[]]): this {
    const list: SelectClauseNode[] = [];

    const add = (v: unknown, as?: string) => {
      if (v != null) {
        list.push(new SelectClauseNode(asNode(v), as ? unquote(as)! : ''));
      }
    };

    const visit = (e: PivotUsingEntry) => {
      if (e == null) return;
      else if (
        isString(e)
        || isNode(e)
        || isParamLike(e)
        || e instanceof Date
        || typeof e !== 'object'
      ) {
        add(e);
      } else {
        for (const alias in e) add(e[alias], alias);
      }
    };

    expr.forEach(e => isArray(e) ? e.forEach(visit) : visit(e));
    if (list.length === 0) {
      throw new Error('PivotQuery.using requires at least one expression.');
    }
    this._using = this._using.concat(list);
    return this;
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
   * Clone this pivot query.
   */
  clone(): this {
    const { source, ...rest } = this;
    // @ts-expect-error creates pivot query
    return Object.assign(new PivotQuery(source), rest, {
      _with: this._with.slice(),
      _on: this._on.slice(),
      _in: this._in.slice(),
      _using: this._using.slice(),
      _groupby: this._groupby.slice(),
      _orderby: this._orderby.slice(),
      _limitPerc: this._limitPerc,
      _limit: this._limit,
      _offset: this._offset
    });
  }
}

setPivotQueryFactory(source => new PivotQuery(source));
