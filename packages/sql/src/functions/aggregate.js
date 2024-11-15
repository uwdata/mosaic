import { AggregateNode } from '../ast/aggregate.js';
import { aggFn } from '../util/function.js';

/**
 * Compute an arg_max aggregate.
 * @param {import('../types.js').ExprValue} y The argument to return.
 * @param {import('../types.js').ExprValue} x The expression to maximize.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function argmax(y, x) {
  return aggFn('arg_max', y, x);
}

/**
 * Compute an arg_min aggregate.
 * @param {import('../types.js').ExprValue} y The argument to return.
 * @param {import('../types.js').ExprValue} x The expression to minimize.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function argmin(y, x) {
  return aggFn('arg_min', y, x);
}

/**
 * Compute an array aggregation.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function arrayAgg(expr) {
  return aggFn('array_agg', expr);
}

/**
 * Compute an average aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function avg(expr) {
  return aggFn('avg', expr);
}

/**
 * Compute a correlation aggregate.
 * @param {import('../types.js').ExprValue} x The x expression to aggregate.
 * @param {import('../types.js').ExprValue} y The y expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function corr(x, y) {
  return aggFn('corr', x, y);
}

/**
 * Compute a count aggregate.
 * @param {import('../types.js').ExprValue} [expr] An optional expression
 *  to count. If specified, only non-null expression values are counted.
 *  If omitted, all rows within a group are counted.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function count(expr) {
  return aggFn('count', expr);
}

/**
 * Compute a sample covariance aggregate.
 * @param {import('../types.js').ExprValue} x The x expression to aggregate.
 * @param {import('../types.js').ExprValue} y The y expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function covariance(x, y) {
  return aggFn('covar_samp', x, y);
}

/**
 * Compute a population covariance aggregate.
 * @param {import('../types.js').ExprValue} x The x expression to aggregate.
 * @param {import('../types.js').ExprValue} y The y expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function covarPop(x, y) {
  return aggFn('covar_pop', x, y);
}

/**
 * Compute an entropy aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function entropy(expr) {
  return aggFn('entropy', expr);
}

/**
 * Compute a first aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function first(expr) {
  return aggFn('first', expr);
}

/**
 * Compute a sample kurtosis aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function kurtosis(expr) {
  return aggFn('kurtosis', expr);
}

/**
 * Compute a median absolute deviation (MAD) aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function mad(expr) {
  return aggFn('mad', expr);
}

/**
 * Compute a maximum aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function max(expr) {
  return aggFn('max', expr);
}

/**
 * Compute a median aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function median(expr) {
  return aggFn('median', expr);
}

/**
 * Compute a minimum aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function min(expr) {
  return aggFn('min', expr);
}

/**
 * Compute a mode aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function mode(expr) {
  return aggFn('mode', expr);
}

/**
 * Compute a last aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function last(expr) {
  return aggFn('last', expr);
}

/**
 * Compute a product aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function product(expr) {
  return aggFn('product', expr);
}

/**
 * Compute a quantile aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @param {import('../types.js').ExprValue} p The quantile value.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function quantile(expr, p) {
  return aggFn('quantile', expr, p);
}

/**
 * Compute a linear regression reg_avgX aggregate.
 * @param {import('../types.js').ExprValue} x The x expression to aggregate.
 * @param {import('../types.js').ExprValue} y The y expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function regrAvgX(x, y) {
  return aggFn('regr_avgx', x, y);
}

/**
 * Compute a linear regression reg_avgY aggregate.
 * @param {import('../types.js').ExprValue} x The x expression to aggregate.
 * @param {import('../types.js').ExprValue} y The y expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function regrAvgY(x, y) {
  return aggFn('regr_avgy', x, y);
}

/**
 * Compute a linear regression count aggregate.
 * This returns the count of rows where both x and y are non-null.
 * @param {import('../types.js').ExprValue} x The x expression to aggregate.
 * @param {import('../types.js').ExprValue} y The y expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function regrCount(x, y) {
  return aggFn('regr_count', x, y);
}

/**
 * Compute a linear regression intercept aggregate.
 * @param {import('../types.js').ExprValue} x The x expression to aggregate.
 * @param {import('../types.js').ExprValue} y The y expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function regrIntercept(x, y) {
  return aggFn('regr_intercept', x, y);
}

/**
 * Compute a linear regression R^2 aggregate.
 * @param {import('../types.js').ExprValue} x The x expression to aggregate.
 * @param {import('../types.js').ExprValue} y The y expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function regrR2(x, y) {
  return aggFn('regr_r2', x, y);
}

/**
 * Compute a linear regression regr_sxx aggregate.
 * @param {import('../types.js').ExprValue} x The x expression to aggregate.
 * @param {import('../types.js').ExprValue} y The y expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function regrSXX(x, y) {
  return aggFn('regr_sxx', x, y);
}

/**
 * Compute a linear regression regr_sxy aggregate.
 * @param {import('../types.js').ExprValue} x The x expression to aggregate.
 * @param {import('../types.js').ExprValue} y The y expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function regrSXY(x, y) {
  return aggFn('regr_sxy', x, y);
}

/**
 * Compute a linear regression regr_syy aggregate.
 * @param {import('../types.js').ExprValue} x The x expression to aggregate.
 * @param {import('../types.js').ExprValue} y The y expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function regrSYY(x, y) {
  return aggFn('regr_syy', x, y);
}

/**
 * Compute a linear regression slope aggregate.
 * @param {import('../types.js').ExprValue} x The x expression to aggregate.
 * @param {import('../types.js').ExprValue} y The y expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function regrSlope(x, y) {
  return aggFn('regr_slope', x, y);
}

/**
 * Compute a skewness aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function skewness(expr) {
  return aggFn('skewness', expr);
}

/**
 * Compute a sample standard deviation aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function stddev(expr) {
  return aggFn('stddev', expr);
}

/**
 * Compute a population standard deviation aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function stddevPop(expr) {
  return aggFn('stddev_pop', expr);
}

/**
 * Compute a string aggregation.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function stringAgg(expr) {
  return aggFn('string_agg', expr);
}

/**
 * Compute a sum aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function sum(expr) {
  return aggFn('sum', expr);
}

/**
 * Compute a sample variance aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function variance(expr) {
  return aggFn('var_samp', expr);
}

/**
 * Compute a population variance aggregate.
 * @param {import('../types.js').ExprValue} expr The expression to aggregate.
 * @returns {AggregateNode} A SQL aggregate function call.
 */
export function varPop(expr) {
  return aggFn('var_pop', expr);
}
