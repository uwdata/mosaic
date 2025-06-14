/**
 * @import { ExprVarArgs, OrderByExpr } from '../types.js'
 * @import { WindowFrameNode } from './window-frame.js'
 */
import { AGGREGATE } from '../constants.js';
import { asVerbatim } from '../util/ast.js';
import { exprList } from '../util/function.js';
import { isString } from '../util/type-check.js';
import { ExprNode } from './node.js';
import { WindowNode } from './window.js';

export class AggregateNode extends ExprNode {
  /**
   * Instantiate an aggregate function node.
   * @param {string} name The aggregate function name.
   * @param {ExprNode[]} args The aggregate function arguments.
   * @param {boolean} [distinct] The distinct flag.
   * @param {ExprNode} [filter] Filter expression.
   * @param {OrderByExpr} [argOrder] Order by expression.
   */
  constructor(name, args, distinct = false, filter = null, argOrder = []) {
    super(AGGREGATE);
    /**
     * The aggregate function name.
     * @type {string}
     * @readonly
     */
    this.name = name;
    /**
     * The aggregate function arguments.
     * @type {ExprNode[]}
     * @readonly
     */
    this.args = args;
    /**
     * The distinct flag.
     * @type {boolean}
     * @readonly
     */
    this.isDistinct = distinct;
    /**
     * Filter criteria.
     * @type {ExprNode}
     * @readonly
     */
    this.filter = filter;
    /**
     * Order by expression for order-sensitive aggregates.
     * @type {ExprNode[]}
     * @readonly
     */
    this.order = exprList([argOrder]);
  }

  /**
   * Return a new derived aggregate over distinct values.
   * @param {boolean} [isDistinct=true] The distinct flag.
   * @returns {AggregateNode} A new aggregate node.
   */
  distinct(isDistinct = true) {
    return new AggregateNode(this.name, this.args, isDistinct, this.filter, this.order);
  }

  /**
   * Return a new derived aggregate function that filters values.
   * @param {ExprNode | string} filter The filter expression.
   * @returns {AggregateNode} A new aggregate node.
   */
  where(filter) {
    if (isString(filter)) filter = asVerbatim(filter);
    return new AggregateNode(this.name, this.args, this.isDistinct, filter, this.order);
  }

  /**
   * Return a new derived aggregate function that sorts values prior to aggregation.
   * @param {OrderByExpr} order The order by expression.
   * @returns {AggregateNode} A new aggregate node.
   */
  argOrder(order) {
    return new AggregateNode(this.name, this.args, this.isDistinct, this.filter, order);
  }

  /**
   * Return a new window function over this aggregate.
   * @returns {WindowNode} A new window node.
   */
  window() {
    return new WindowNode(this);
  }

  /**
   * Return a new window function over this aggregate with the given partitions.
   * @param {...ExprVarArgs} expr The partition by criteria.
   * @returns {WindowNode} A new window node.
   */
  partitionby(...expr) {
    return this.window().partitionby(...expr);
  }

  /**
   * Return a new window function over this aggregate with the given ordering.
   * @param {...ExprVarArgs} expr The order by criteria.
   * @returns {WindowNode} A new window node.
   */
  orderby(...expr) {
    return this.window().orderby(...expr);
  }

  /**
   * Return a new window function over this aggregate with the given frame.
   * @param {WindowFrameNode} framedef The window frame definition.
   * @returns {WindowNode} A new window node.
   */
  frame(framedef) {
    return this.window().frame(framedef);
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const { name, args, isDistinct, filter, order } = this;
    const arg = [
      isDistinct ? 'DISTINCT' : '',
      args?.length ? args.join(', ')
        : name.toLowerCase() === 'count' ?  '*'
        : '',
      order.length ? `ORDER BY ${order.join(', ')}` : ''
    ].filter(x => x).join(' ');
    const filt = filter ? ` FILTER (WHERE ${filter})` : '';
    return `${name}(${arg})${filt}`;
  }
}

/**
 * Check if a function name corresponds to an aggregate function.
 * @param {string} name The function name to check
 * @returns {boolean} True if a known aggregate function, false otherwise.
 */
export function isAggregateFunction(name) {
  return aggregateNames.includes(name.toLowerCase());
}

/**
 * An array of known aggregate function names.
 * From https://duckdb.org/docs/sql/functions/aggregates.html.
 */
export const aggregateNames = [
  'any_value',
  'approx_count_distinct',
  'approx_quantile',
  'arbitrary',
  'arg_max',
  'arg_max_null',
  'arg_min',
  'arg_min_null',
  'array_agg',
  'avg',
  'bit_and',
  'bit_or',
  'bit_xor',
  'bitstring_agg',
  'bool_and',
  'bool_or',
  'corr',
  'count',
  'count_star',
  'covar_pop',
  'covar_samp',
  'entropy',
  'favg',
  'first',
  'fsum',
  'geomean',
  'kurtosis_pop',
  'kurtosis',
  'last',
  'mad',
  'max',
  'max_by',
  'median',
  'min',
  'min_by',
  'mode',
  'product',
  'quantile',
  'quantile_cont',
  'quantile_disc',
  'regr_avgx',
  'regr_avgy',
  'regr_count',
  'regr_intercept',
  'regr_r2',
  'regr_sxx',
  'regr_sxy',
  'regr_syy',
  'regr_slope',
  'reservoir_quantile',
  'skewness',
  'stddev',
  'stddev_pop',
  'stddev_samp',
  'string_agg',
  'sum',
  'variance',
  'var_pop',
  'var_samp'
];
