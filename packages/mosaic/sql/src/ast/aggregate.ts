import type { ExprVarArgs, OrderByExpr } from '../types.js';
import type { WindowFrameNode } from './window-frame.js';
import { AGGREGATE } from '../constants.js';
import { asVerbatim } from '../util/ast.js';
import { nodeList } from '../util/function.js';
import { isString } from '../util/type-check.js';
import { ExprNode } from './node.js';
import { WindowNode } from './window.js';

export class AggregateNode extends ExprNode {
  /** The aggregate function name. */
  readonly name: string;
  /** The aggregate function arguments. */
  readonly args: ExprNode[];
  /** The distinct flag. */
  readonly isDistinct: boolean;
  /** Filter criteria. */
  readonly filter: ExprNode | null;
  /** Order by expression for order-sensitive aggregates. */
  readonly order: ExprNode[];

  /**
   * Instantiate an aggregate function node.
   * @param name The aggregate function name.
   * @param args The aggregate function arguments.
   * @param distinct The distinct flag.
   * @param filter Filter expression.
   * @param argOrder Order by expression.
   */
  constructor(
    name: string,
    args: ExprNode[],
    distinct: boolean = false,
    filter: ExprNode | null = null,
    argOrder: OrderByExpr = []
  ) {
    super(AGGREGATE);
    this.name = name;
    this.args = args;
    this.isDistinct = distinct;
    this.filter = filter;
    this.order = nodeList([argOrder]);
  }

  /**
   * Return a new derived aggregate over distinct values.
   * @param isDistinct The distinct flag.
   * @returns A new aggregate node.
   */
  distinct(isDistinct: boolean = true) {
    return new AggregateNode(this.name, this.args, isDistinct, this.filter, this.order);
  }

  /**
   * Return a new derived aggregate function that filters values.
   * @param The filter expression.
   * @returns A new aggregate node.
   */
  where(filter: ExprNode | string) {
    if (isString(filter)) filter = asVerbatim(filter);
    return new AggregateNode(this.name, this.args, this.isDistinct, filter, this.order);
  }

  /**
   * Return a new derived aggregate function that sorts values prior to aggregation.
   * @param order The order by expression.
   * @returns A new aggregate node.
   */
  argOrder(order: OrderByExpr) {
    return new AggregateNode(this.name, this.args, this.isDistinct, this.filter, order);
  }

  /**
   * Return a new window function over this aggregate.
   * @returns A new window node.
   */
  window() {
    return new WindowNode(this);
  }

  /**
   * Return a new window function over this aggregate with the given partitions.
   * @param expr The partition by criteria.
   * @returns A new window node.
   */
  partitionby(...expr: ExprVarArgs[]) {
    return this.window().partitionby(...expr);
  }

  /**
   * Return a new window function over this aggregate with the given ordering.
   * @param expr The order by criteria.
   * @returns A new window node.
   */
  orderby(...expr: ExprVarArgs[]) {
    return this.window().orderby(...expr);
  }

  /**
   * Return a new window function over this aggregate with the given frame.
   * @param framedef The window frame definition.
   * @returns A new window node.
   */
  frame(framedef: WindowFrameNode) {
    return this.window().frame(framedef);
  }


}

/**
 * Check if a function name corresponds to an aggregate function.
 * @param name The function name to check
 * @returns True if a known aggregate function, false otherwise.
 */
export function isAggregateFunction(name: string) {
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
