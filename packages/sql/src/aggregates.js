import { SQLExpression, parseSQL, sql } from './expression.js';
import { asColumn } from './ref.js';
import { repeat } from './repeat.js';
import { literalToSQL } from './to-sql.js';
import { WindowFunction } from './windows.js';

/**
 * Tag function for SQL aggregate expressions. Interpolated values
 * may be strings, other SQL expression objects (such as column
 * references), or parameterized values.
 */
export function agg(strings, ...exprs) {
  return sql(strings, ...exprs).annotate({ aggregate: true });
}

/**
 * Base class for individual aggregate functions.
 * Most callers should use a dedicated aggregate function
 * rather than instantiate this class.
 */
export class AggregateFunction extends SQLExpression {
  /**
   * Create a new AggregateFunction instance.
   * @param {*} op The aggregate operation.
   * @param {*} [args] The aggregate function arguments.
   * @param {*} [type] The SQL data type to cast to.
   * @param {boolean} [isDistinct] Flag indicating if this is a distinct value aggregate.
   * @param {*} [filter] Filtering expression to apply prior to aggregation.
   */
  constructor(op, args, type, isDistinct, filter) {
    args = (args || []).map(asColumn);
    const { strings, exprs } = aggExpr(op, args, type, isDistinct, filter);
    const { spans, cols } = parseSQL(strings, exprs);
    super(spans, cols);
    this.aggregate = op;
    this.args = args;
    this.type = type;
    this.isDistinct = isDistinct;
    this.filter = filter;
  }

  get basis() {
    return this.column;
  }

  get label() {
    const { aggregate: op, args, isDistinct } = this;
    const dist = isDistinct ? 'DISTINCT' + (args.length ? ' ' : '') : '';
    const tail = args.length ? `(${dist}${args.map(unquoted).join(', ')})` : '';
    return `${op.toLowerCase()}${tail}`;
  }

  /**
   * Return a new derived aggregate function over distinct values.
   * @returns {AggregateFunction} A new aggregate function.
   */
  distinct() {
    const { aggregate: op, args, type, filter } = this;
    return new AggregateFunction(op, args, type, true, filter);
  }

  /**
   * Return a new derived aggregate function that filters values.
   * @param {*} filter The filter expresion.
   * @returns {AggregateFunction} A new aggregate function.
   */
  where(filter) {
    const { aggregate: op, args, type, isDistinct } = this;
    return new AggregateFunction(op, args, type, isDistinct, filter);
  }

  /**
   * Return a new window function over this aggregate.
   * @returns {WindowFunction} A new aggregate function.
   */
  window() {
    const { aggregate: op, args, type, isDistinct } = this;
    const func = new AggregateFunction(op, args, null, isDistinct);
    return new WindowFunction(op, func, type);
  }

  /**
   * Return a window function over this aggregate with the given partitioning.
   * @param {*} expr The grouping (partition by) criteria for the window function.
   * @returns {WindowFunction} A new window function.
   */
  partitionby(...expr) {
    return this.window().partitionby(...expr);
  }

  /**
   * Return a window function over this aggregate with the given ordering.
   * @param {*} expr The sorting (order by) criteria for the window function.
   * @returns {WindowFunction} A new window function.
   */
  orderby(...expr) {
    return this.window().orderby(...expr);
  }

  /**
   * Return a window function over this aggregate with the given row frame.
   * @param {(number|null)[] | import('./expression.js').ParamLike} frame The row-based window frame.
   * @returns {WindowFunction} A new window function.
   */
  rows(frame) {
    return this.window().rows(frame);
  }

  /**
   * Return a window function over this aggregate with the given range frame.
   * @param {(number|null)[] | import('./expression.js').ParamLike} frame The range-based window frame.
   * @returns {WindowFunction} A new window function.
   */
  range(frame) {
    return this.window().range(frame);
  }
}

function aggExpr(op, args, type, isDistinct, filter) {
  const close = `)${type ? `::${type}` : ''}`;
  let strings = [`${op}(${isDistinct ? 'DISTINCT ' :''}`];
  let exprs = [];
  if (args.length) {
    strings = strings.concat([
      ...repeat(args.length - 1, ', '),
      `${close}${filter ? ' FILTER (WHERE ' : ''}`,
      ...(filter ? [')'] : [])
    ]);
    exprs = [...args, ...(filter ? [filter] : [])];
  } else {
    strings[0] += '*' + close;
  }
  return { exprs, strings };
}

function unquoted(value) {
  const s = literalToSQL(value);
  return s && s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s
}

function aggf(op, type) {
  return (...args) => new AggregateFunction(op, args, type);
}

export const count = aggf('COUNT', 'INTEGER');
export const avg = aggf('AVG');
export const mean = aggf('AVG');
export const mad = aggf('MAD');
export const max = aggf('MAX');
export const min = aggf('MIN');
export const sum = aggf('SUM', 'DOUBLE');
export const product = aggf('PRODUCT');
export const median = aggf('MEDIAN');
export const quantile = aggf('QUANTILE');
export const mode = aggf('MODE');

export const variance = aggf('VARIANCE');
export const stddev = aggf('STDDEV');
export const skewness = aggf('SKEWNESS');
export const kurtosis = aggf('KURTOSIS');
export const entropy = aggf('ENTROPY');
export const varPop = aggf('VAR_POP');
export const stddevPop = aggf('STDDEV_POP');

export const corr = aggf('CORR');
export const covariance = aggf('COVAR_SAMP');
export const covarPop = aggf('COVAR_POP');
export const regrIntercept = aggf('REGR_INTERCEPT');
export const regrSlope = aggf('REGR_SLOPE');
export const regrCount = aggf('REGR_COUNT');
export const regrR2 = aggf('REGR_R2');
export const regrSYY = aggf('REGR_SYY');
export const regrSXX = aggf('REGR_SXX');
export const regrSXY = aggf('REGR_SXY');
export const regrAvgX = aggf('REGR_AVGX');
export const regrAvgY = aggf('REGR_AVGY');

export const first = aggf('FIRST');
export const last = aggf('LAST');

export const argmin = aggf('ARG_MIN');
export const argmax = aggf('ARG_MAX');

export const stringAgg = aggf('STRING_AGG');
export const arrayAgg = aggf('ARRAY_AGG');
