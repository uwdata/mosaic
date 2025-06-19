import type { ExprValue } from '../types.js';
import { aggFn } from '../util/function.js';

/**
 * Compute an arg_max aggregate.
 * @param y The argument to return.
 * @param x The expression to maximize.
 * @returns A SQL aggregate function call.
 */
export function argmax(y: ExprValue, x: ExprValue) {
  return aggFn('arg_max', y, x);
}

/**
 * Compute an arg_min aggregate.
 * @param y The argument to return.
 * @param x The expression to minimize.
 * @returns A SQL aggregate function call.
 */
export function argmin(y: ExprValue, x: ExprValue) {
  return aggFn('arg_min', y, x);
}

/**
 * Compute an array aggregation.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function arrayAgg(expr: ExprValue) {
  return aggFn('array_agg', expr);
}

/**
 * Compute an average aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function avg(expr: ExprValue) {
  return aggFn('avg', expr);
}

/**
 * Compute a correlation aggregate.
 * @param x The x expression to aggregate.
 * @param y The y expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function corr(x: ExprValue, y: ExprValue) {
  return aggFn('corr', x, y);
}

/**
 * Compute a count aggregate.
 * @param [expr] An optional expression
 *  to count. If specified, only non-null expression values are counted.
 *  If omitted, all rows within a group are counted.
 * @returns A SQL aggregate function call.
 */
export function count(expr?: ExprValue) {
  return aggFn('count', expr);
}

/**
 * Compute a sample covariance aggregate.
 * @param x The x expression to aggregate.
 * @param y The y expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function covariance(x: ExprValue, y: ExprValue) {
  return aggFn('covar_samp', x, y);
}

/**
 * Compute a population covariance aggregate.
 * @param x The x expression to aggregate.
 * @param y The y expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function covarPop(x: ExprValue, y: ExprValue) {
  return aggFn('covar_pop', x, y);
}

/**
 * Compute an entropy aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function entropy(expr: ExprValue) {
  return aggFn('entropy', expr);
}

/**
 * Compute a first aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function first(expr: ExprValue) {
  return aggFn('first', expr);
}

/**
 * Compute a geomean aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function geomean(expr: ExprValue) {
  return aggFn('geomean', expr);
}

/**
 * Compute a sample kurtosis aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function kurtosis(expr: ExprValue) {
  return aggFn('kurtosis', expr);
}

/**
 * Compute a median absolute deviation (MAD) aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function mad(expr: ExprValue) {
  return aggFn('mad', expr);
}

/**
 * Compute a maximum aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function max(expr: ExprValue) {
  return aggFn('max', expr);
}

/**
 * Compute a median aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function median(expr: ExprValue) {
  return aggFn('median', expr);
}

/**
 * Compute a minimum aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function min(expr: ExprValue) {
  return aggFn('min', expr);
}

/**
 * Compute a mode aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function mode(expr: ExprValue) {
  return aggFn('mode', expr);
}

/**
 * Compute a last aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function last(expr: ExprValue) {
  return aggFn('last', expr);
}

/**
 * Compute a product aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function product(expr: ExprValue) {
  return aggFn('product', expr);
}

/**
 * Compute a quantile aggregate.
 * @param expr The expression to aggregate.
 * @param p The quantile value.
 * @returns A SQL aggregate function call.
 */
export function quantile(expr: ExprValue, p: ExprValue) {
  return aggFn('quantile', expr, p);
}

/**
 * Compute a linear regression reg_avgX aggregate.
 * @param x The x expression to aggregate.
 * @param y The y expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function regrAvgX(x: ExprValue, y: ExprValue) {
  return aggFn('regr_avgx', x, y);
}

/**
 * Compute a linear regression reg_avgY aggregate.
 * @param x The x expression to aggregate.
 * @param y The y expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function regrAvgY(x: ExprValue, y: ExprValue) {
  return aggFn('regr_avgy', x, y);
}

/**
 * Compute a linear regression count aggregate.
 * This returns the count of rows where both x and y are non-null.
 * @param x The x expression to aggregate.
 * @param y The y expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function regrCount(x: ExprValue, y: ExprValue) {
  return aggFn('regr_count', x, y);
}

/**
 * Compute a linear regression intercept aggregate.
 * @param x The x expression to aggregate.
 * @param y The y expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function regrIntercept(x: ExprValue, y: ExprValue) {
  return aggFn('regr_intercept', x, y);
}

/**
 * Compute a linear regression R^2 aggregate.
 * @param x The x expression to aggregate.
 * @param y The y expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function regrR2(x: ExprValue, y: ExprValue) {
  return aggFn('regr_r2', x, y);
}

/**
 * Compute a linear regression regr_sxx aggregate.
 * @param x The x expression to aggregate.
 * @param y The y expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function regrSXX(x: ExprValue, y: ExprValue) {
  return aggFn('regr_sxx', x, y);
}

/**
 * Compute a linear regression regr_sxy aggregate.
 * @param x The x expression to aggregate.
 * @param y The y expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function regrSXY(x: ExprValue, y: ExprValue) {
  return aggFn('regr_sxy', x, y);
}

/**
 * Compute a linear regression regr_syy aggregate.
 * @param x The x expression to aggregate.
 * @param y The y expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function regrSYY(x: ExprValue, y: ExprValue) {
  return aggFn('regr_syy', x, y);
}

/**
 * Compute a linear regression slope aggregate.
 * @param x The x expression to aggregate.
 * @param y The y expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function regrSlope(x: ExprValue, y: ExprValue) {
  return aggFn('regr_slope', x, y);
}

/**
 * Compute a skewness aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function skewness(expr: ExprValue) {
  return aggFn('skewness', expr);
}

/**
 * Compute a sample standard deviation aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function stddev(expr: ExprValue) {
  return aggFn('stddev', expr);
}

/**
 * Compute a population standard deviation aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function stddevPop(expr: ExprValue) {
  return aggFn('stddev_pop', expr);
}

/**
 * Compute a string aggregation.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function stringAgg(expr: ExprValue) {
  return aggFn('string_agg', expr);
}

/**
 * Compute a sum aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function sum(expr: ExprValue) {
  return aggFn('sum', expr);
}

/**
 * Compute a sample variance aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function variance(expr: ExprValue) {
  return aggFn('var_samp', expr);
}

/**
 * Compute a population variance aggregate.
 * @param expr The expression to aggregate.
 * @returns A SQL aggregate function call.
 */
export function varPop(expr: ExprValue) {
  return aggFn('var_pop', expr);
}
