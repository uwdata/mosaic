import { AggregateNode, and, argmax, argmin, count, div, ExprNode, isNotNull, max, min, mul, pow, regrAvgX, regrAvgY, regrCount, sql, sqrt, sub, sum } from '@uwdata/mosaic-sql';
import { fnv_hash } from '../util/hash.js';

/**
 * Determine sufficient statistics to preaggregate the given node. This
 * method populates the *preagg* and *aggrs* arguments with necessary
 * information for preaggregation optimization.
 * @param {AggregateNode} node An aggregate function.
 * @param {Record<string, ExprNode>} preagg Map of column names to
 *  expressions to include in the preaggregation table.
 * @returns {ExprNode} Output aggregate expression that uses preaggregated
 *  sufficient statistics to service updates.
 */
export function sufficientStatistics(node, preagg, avg) {
  switch (node.name) {
    case 'count':
    case 'sum':
      return sumExpr(preagg, node);
    case 'avg':
      return avgExpr(preagg, node);
    case 'arg_max':
      return argmaxExpr(preagg, node);
    case 'arg_min':
      return argminExpr(preagg, node);

    // variance statistics drop the original aggregate operation
    // in favor of tracking sufficient statistics
    case 'variance':
    case 'var_samp':
      return varianceExpr(preagg, node, avg);
    case 'var_pop':
      return varianceExpr(preagg, node, avg, false);
    case 'stddev':
    case 'stddev_samp':
      return sqrt(varianceExpr(preagg, node, avg));
    case 'stddev_pop':
      return sqrt(varianceExpr(preagg, node, avg, false));
    case 'covar_samp':
      return covarianceExpr(preagg, node, avg);
    case 'covar_pop':
      return covarianceExpr(preagg, node, avg, false);
    case 'corr':
      return corrExpr(preagg, node, avg);

    // regression statistics
    case 'regr_count':
      return regrCountExpr(preagg, node).expr;
    case 'regr_avgx':
      return regrAvgXExpr(preagg, node);
    case 'regr_avgy':
      return regrAvgYExpr(preagg, node);
    case 'regr_syy':
      return regrVarExpr(preagg, 0, node, avg);
    case 'regr_sxx':
      return regrVarExpr(preagg, 1, node, avg);
    case 'regr_sxy':
      return covarianceExpr(preagg, node, avg, null);
    case 'regr_slope':
      return regrSlopeExpr(preagg, node, avg);
    case 'regr_intercept':
      return regrInterceptExpr(preagg, node, avg);
    case 'regr_r2':
      return pow(corrExpr(preagg, node, avg), 2);

    // aggregates that commute directly
    case 'max':
    case 'min':
    case 'bit_and':
    case 'bit_or':
    case 'bit_xor':
    case 'bool_and':
    case 'bool_or':
    case 'product': {
      const name = colName(node);
      preagg[name] = node;
      return sql`${node.name}("${name}")`;
    }

    // unsupported aggregate, return null to indicate failure
    default: return null;
  }
}

/**
 * Generate a column name for the given aggregate node. The name is
 * made from a hash of the string-serialized SQL expression.
 * @param {AggregateNode} node The aggregate node to name.
 * @returns {string} The generated column name.
 */
function colName(node) {
  return 'pre_' + fnv_hash(`${node}`).toString(16);
}

/**
 * Add a sufficient statistic to the preaggregation column set.
 * Generates a unique column name for the statistic and propagates
 * a FILTER clause if one exists on the original aggregate node.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} expr The aggregate statistic to add.
 * @param {AggregateNode} [node] The originating aggregate function call.
 * @returns {string} The name of the statistic column.
 */
function addStat(preagg, expr, node) {
  const filter = node?.filter;
  if (filter) {
    // push filter clause to preaggregate expr
    expr = expr.filter
      ? expr.where(and(filter, expr.filter))
      : expr.where(filter);
  }
  const name = colName(expr);
  preagg[name] = expr;
  return name;
}

/**
 * Generate an expression for calculating counts over data dimensions.
 * As a side effect, this method adds a column to the input *preagg* object
 * to track the count of non-null values per-partition.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} node The originating aggregate function call.
 * @returns {{ expr: ExprNode, name: string }} An aggregate expression over
 *  pre-aggregated dimensions and associated column name.
 */
function countExpr(preagg, node) {
  const name = addStat(preagg, count(node.args[0]), node);
  return { expr: sum(name), name };
}

/**
 * Generate an expression for calculating counts or sums over data dimensions.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} node The originating aggregate function call.
 * @returns {ExprNode} An aggregate expression over pre-aggregated dimensions.
 */
function sumExpr(preagg, node) {
  return sum(addStat(preagg, node));
}

/**
 * Generate an expression for calculating averages over data dimensions.
 * As a side effect, this method adds a column to the input *preagg* object
 * to track the count of non-null values per-partition.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} [node] The originating aggregate function call.
 * @returns {ExprNode} An aggregate expression over pre-aggregated dimensions.
 */
function avgExpr(preagg, node) {
  const as = addStat(preagg, node);
  const { expr, name } = countExpr(preagg, node);
  return div(sum(mul(as, name)), expr);
}

/**
 * Generate an expression for calculating argmax over data dimensions.
 * As a side effect, this method adds a column to the input *preagg* object
 * to track a maximum value per-partition.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} node The originating aggregate function call.
 * @returns {ExprNode} An aggregate expression over pre-aggregated dimensions.
 */
function argmaxExpr(preagg, node) {
  const expr = addStat(preagg, node);
  const maxy = addStat(preagg, max(node.args[1]), node);
  return argmax(expr, maxy);
}

/**
 * Generate an expression for calculating argmin over data dimensions.
 * As a side effect, this method adds a column to the input *preagg* object
 * to track a minimum value per-partition.
 * @param {object} preagg An object for columns (such as
 *  sufficient statistics) to include in the pre-aggregation.
 * @param {AggregateNode} node Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @returns {ExprNode} An aggregate expression over pre-aggregated dimensions.
 */
function argminExpr(preagg, node) {
  const expr = addStat(preagg, node);
  const miny = addStat(preagg, min(node.args[1]), node);
  return argmin(expr, miny);
}

/**
 * Generate an expression for calculating variance over data dimensions.
 * This method uses the "textbook" definition of variance (E[X^2] - E[X]^2),
 * but on mean-centered data to reduce floating point error. The variance
 * calculation uses three sufficient statistics: the count of non-null values,
 * the residual sum of squares and the sum of residual (mean-centered) values.
 * As a side effect, this method adds columns for these statistics to the
 * input *preagg* object.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} node The originating aggregate function call.
 * @param {(field: any) => ExprNode} avg Global average query generator.
 * @param {boolean} [correction=true] A flag for whether a Bessel
 *  correction should be applied to compute the sample variance
 *  rather than the populatation variance.
 * @returns {ExprNode} An aggregate expression over pre-aggregated dimensions.
 */
function varianceExpr(preagg, node, avg, correction = true) {
  const x = node.args[0];
  const { expr: n } = countExpr(preagg, node);
  const delta = sub(x, avg(x));
  const rssq = addStat(preagg, sum(pow(delta, 2)), node); // residual sum of squares
  const rsum = addStat(preagg, sum(delta), node); // residual sum
  const denom = correction ? sub(n, 1) : n; // Bessel correction
  return div(sub(sum(rssq), div(pow(sum(rsum), 2), n)), denom);
}

/**
 * Generate an expression for calculating covariance over data dimensions.
 * This method uses mean-centered data to reduce floating point error. The
 * covariance calculation uses four sufficient statistics: the count of
 * non-null value pairs, the sum of residual products, and residual sums
 * (of mean-centered values) for x and y. As a side effect, this method
 * adds columns for these statistics to the input *preagg* object.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} node The originating aggregate function call.
 * @param {(field: any) => ExprNode} avg Global average query generator.
 * @param {boolean|null} [correction=true] A flag for whether a Bessel
 *  correction should be applied to compute the sample covariance rather
 *  than the populatation covariance. If null, an expression for the
 *  unnormalized covariance (no division by sample count) is returned.
 * @returns {ExprNode} An aggregate expression over pre-aggregated dimensions.
 */
function covarianceExpr(preagg, node, avg, correction = true) {
  const { expr: n } = regrCountExpr(preagg, node);
  const sxy = regrSumXYExpr(preagg, node, avg);
  const sx = regrSumExpr(preagg, 1, node, avg);
  const sy = regrSumExpr(preagg, 0, node, avg);
  const num = sub(sxy, div(mul(sx, sy), n));
  return correction === null ? num // do not divide by count
    : correction ? div(num, sub(n, 1)) // Bessel correction (sample)
    : div(num, n); // no correction (population)
}

/**
 * Generate an expression for calculating Pearson product-moment correlation
 * coefficients over data dimensions. This method uses mean-centered data
 * to reduce floating point error. The correlation calculation uses six
 * sufficient statistics: the count of non-null value pairs, the sum of
 * residual products, and both residual sums and sums of squares for x and y.
 * As a side effect, this method adds columns for these statistics to the
 * input *preagg* object.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} node The originating aggregate function call.
 * @param {(field: any) => ExprNode} avg Global average query generator.
 * @returns {ExprNode} An aggregate expression over pre-aggregated dimensions.
 */
function corrExpr(preagg, node, avg) {
  const { expr: n } = regrCountExpr(preagg, node);
  const sxy = regrSumXYExpr(preagg, node, avg);
  const sxx = regrSumSqExpr(preagg, 1, node, avg);
  const syy = regrSumSqExpr(preagg, 0, node, avg);
  const sx = regrSumExpr(preagg, 1, node, avg);
  const sy = regrSumExpr(preagg, 0, node, avg);
  const vx = sub(sxx, div(pow(sx, 2), n));
  const vy = sub(syy, div(pow(sy, 2), n));
  return div(
    sub(sxy, div(mul(sx, sy), n)),
    sqrt(mul(vx, vy))
  );
}

/**
 * Generate an expression for the count of non-null (x, y) pairs. As a side
 * effect, this method adds columns to the input *preagg* object to the
 * partition-level count of non-null pairs.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} node The originating aggregate function call.
 * @returns {{ expr: ExprNode, name: string }} An aggregate expression over
 *  pre-aggregated dimensions and associated column name.
 */
function regrCountExpr(preagg, node) {
  const [x, y] = node.args;
  const n = addStat(preagg, regrCount(x, y), node);
  return { expr: sum(n), name: n };
}

/**
 * Generate an expression for calculating sums of residual values for use in
 * covariance and regression queries. Only values corresponding to non-null
 * (x, y) pairs are included. This method uses mean-centered data to reduce
 * floating point error. As a side effect, this method adds a column for
 * partition-level sums to the input *preagg* object.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {number} i An index indicating which argument column to sum.
 * @param {AggregateNode} node The originating aggregate function call.
 * @param {(field: any) => ExprNode} avg Global average query generator.
 * @returns {ExprNode} An aggregate expression over pre-aggregated dimensions.
 */
function regrSumExpr(preagg, i, node, avg) {
  const args = node.args;
  const v = args[i];
  const o = args[1 - i];
  const rsum = sum(sub(v, avg(v))).where(isNotNull(o));
  return sum(addStat(preagg, rsum, node));
}

/**
 * Generate an expressios for calculating sums of squared residual values for
 * use in covariance and regression queries. Only values corresponding to
 * non-null (x, y) pairs are included. This method uses mean-centered data to
 * reduce floating point error. As a side effect, this method adds a column
 * for partition-level sums to the input *preagg* object.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {number} i An index indicating which argument column to sum.
 * @param {AggregateNode} node The originating aggregate function call.
 * @param {(field: any) => ExprNode} avg Global average query generator.
 * @returns {ExprNode} An aggregate expression over pre-aggregated dimensions.
 */
function regrSumSqExpr(preagg, i, node, avg) {
  const args = node.args;
  const v = args[i];
  const u = args[1 - i];
  const ssq = sum(pow(sub(v, avg(v)), 2)).where(isNotNull(u));
  return sum(addStat(preagg, ssq, node));
}

/**
 * Generate an expression for calculating sums of residual product values for
 * use in covariance and regression queries. Only values corresponding to
 * non-null (x, y) pairs are included. This method uses mean-centered data to
 * reduce floating point error. As a side effect, this method adds a column
 * for partition-level sums to the input *preagg* object.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} node The originating aggregate function call.
 * @param {(field: any) => ExprNode} avg Global average query generator.
 * @returns {ExprNode} An aggregate expression over pre-aggregated dimensions.
 */
function regrSumXYExpr(preagg, node, avg) {
  const [y, x] = node.args;
  const sxy = sum(mul(sub(x, avg(x)), sub(y, avg(y))));
  return sum(addStat(preagg, sxy, node));
}

/**
 * Generate an expression for the average x value in a regression context.
 * Only values corresponding to non-null (x, y) pairs are included. As a side
 * effect, this method adds columns to the input *preagg* object to track both
 * the count of non-null pairs and partition-level averages.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} node The originating aggregate function call.
 * @returns {ExprNode} An aggregate expression over pre-aggregated dimensions.
 */
function regrAvgXExpr(preagg, node) {
  const [y, x] = node.args;
  const { expr: n, name } = regrCountExpr(preagg, node);
  const a = addStat(preagg, regrAvgX(y, x), node);
  return div(sum(mul(a, name)), n);
}

/**
 * Generate an expression for the average y value in a regression context.
 * Only values corresponding to non-null (x, y) pairs are included. As a side
 * effect, this method adds columns to the input *preagg* object to track both
 * the count of non-null pairs and partition-level averages.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} node The originating aggregate function call.
 * @returns {ExprNode} An aggregate expression over pre-aggregated dimensions.
 */
function regrAvgYExpr(preagg, node) {
  const [y, x] = node.args;
  const { expr: n, name } = regrCountExpr(preagg, node);
  const a = addStat(preagg, regrAvgY(y, x), node);
  return div(sum(mul(a, name)), n);
}

/**
 * Generate an expression for calculating variance over data dimensions for
 * use in covariance and regression queries. Only values corresponding to
 * non-null (x, y) pairs are included. This method uses mean-centered data to
 * reduce floating point error. As a side effect, this method adds columns
 * for partition-level count and sums to the input *preagg* object.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {number} i The index of the argument to compute the variance for.
 * @param {AggregateNode} node The originating aggregate function call.
 * @param {(field: any) => ExprNode} avg Global average query generator.
 * @returns {ExprNode} An aggregate expression for calculating variance
 *  over pre-aggregated data dimensions.
 */
function regrVarExpr(preagg, i, node, avg) {
  const { expr: n } = regrCountExpr(preagg, node);
  const sum = regrSumExpr(preagg, i, node, avg);
  const ssq = regrSumSqExpr(preagg, i, node, avg);
  return sub(ssq, div(pow(sum, 2), n));
}

/**
 * Generate an expression for calculating a regression slope. The slope is
 * computed as the covariance divided by the variance of the x variable. As a
 * side effect, this method adds columns for sufficient statistics to the
 * input *preagg* object.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} node The originating aggregate function call.
 * @param {(field: any) => ExprNode} avg Global average query generator.
 * @returns {ExprNode} An aggregate expression for calculating regression
 *  slopes over pre-aggregated data dimensions.
 */
function regrSlopeExpr(preagg, node, avg) {
  const cov = covarianceExpr(preagg, node, avg, null);
  const varx = regrVarExpr(preagg, 1, node, avg);
  return div(cov, varx);
}

/**
 * Generate an expression for calculating a regression intercept. The intercept
 * is derived from the regression slope and average x and y values. As a
 * side effect, this method adds columns for sufficient statistics to the
 * input *preagg* object.
 * @param {Record<string, ExprNode>} preagg A map of columns (such as
 *  sufficient statistics) to pre-aggregate.
 * @param {AggregateNode} node The originating aggregate function call.
 * @param {(field: any) => ExprNode} avg Global average query generator.
 * @returns {ExprNode} An aggregate expression for calculating regression
 *  intercepts over pre-aggregated data dimensions.
 */
function regrInterceptExpr(preagg, node, avg) {
  const ax = regrAvgXExpr(preagg, node);
  const ay = regrAvgYExpr(preagg, node);
  const m = regrSlopeExpr(preagg, node, avg);
  return sub(ay, mul(m, ax));
}
