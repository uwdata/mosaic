import { Query, agg, sql } from '@uwdata/mosaic-sql';
import { MosaicClient } from '../MosaicClient.js';

export const NO_INDEX = { from: NaN };

/**
 * Determine data cube index columns for a given Mosaic client.
 * @param {MosaicClient} client The Mosaic client.
 * @returns An object with necessary column data to generate data
 *  cube index columns, null if an invalid or unsupported expression
 *  is encountered, or NO_INDEX if the client is not indexable.
 */
export function indexColumns(client) {
  if (!client.filterIndexable) return NO_INDEX;
  const q = client.query();
  const from = getBaseTable(q);
  if (typeof from !== 'string' || !q.groupby) return NO_INDEX;
  const g = new Set(q.groupby().map(c => c.column));

  const aggr = []; // list of output aggregate columns
  const dims = []; // list of grouping dimension columns
  const aux = {};  // auxiliary columns needed by aggregates

  for (const entry of q.select()) {
    const { as, expr: { aggregate, args } } = entry;
    const op = aggregate?.toUpperCase?.();
    switch (op) {
      case 'COUNT':
      case 'SUM':
        // TODO: revisit this DOUBLE cast in the future
        // for now, this sidesteps client-side conversions
        // of bignum and fixed decimal types to JS numbers
        aggr.push({ [as]: agg`SUM("${as}")::DOUBLE` });
        break;
      case 'AVG':
        aggr.push({ [as]: avgExpr(aux, as, args[0]) });
        break;
      case 'ARG_MAX':
        aggr.push({ [as]: argmaxExpr(aux, as, args) });
        break;
      case 'ARG_MIN':
        aggr.push({ [as]: argminExpr(aux, as, args) });
        break;

      // variance statistics drop the original aggregate operation
      // in favor of tracking auxiliary sufficient statistics
      case 'VARIANCE':
      case 'VAR_SAMP':
        aux[as] = null;
        aggr.push({ [as]: varianceExpr(aux, args[0], from) });
        break;
      case 'VAR_POP':
        aux[as] = null;
        aggr.push({ [as]: varianceExpr(aux, args[0], from, false) });
        break;
      case 'STDDEV':
      case 'STDDEV_SAMP':
        aux[as] = null;
        aggr.push({ [as]: agg`SQRT(${varianceExpr(aux, args[0], from)})` });
        break;
      case 'STDDEV_POP':
        aux[as] = null;
        aggr.push({ [as]: agg`SQRT(${varianceExpr(aux, args[0], from, false)})` });
        break;
      case 'COVAR_SAMP':
        aux[as] = null;
        aggr.push({ [as]: covarianceExpr(aux, args, from) });
        break;
      case 'COVAR_POP':
        aux[as] = null;
        aggr.push({ [as]: covarianceExpr(aux, args, from, false) });
        break;
      case 'CORR':
        aux[as] = null;
        aggr.push({ [as]: corrExpr(aux, args, from) });
        break;

      // regression statistics
      case 'REGR_COUNT':
        aux[as] = null;
        aggr.push({ [as]: agg`${regrCountExpr(aux, args)}::DOUBLE` });
        break;
      case 'REGR_AVGX':
        aux[as] = null;
        aggr.push({ [as]: regrAvgXExpr(aux, args) });
        break;
      case 'REGR_AVGY':
        aux[as] = null;
        aggr.push({ [as]: regrAvgYExpr(aux, args) });
        break;
      case 'REGR_SYY':
        aux[as] = null;
        aggr.push({ [as]: regrVarExpr(aux, 0, args, from) });
        break;
      case 'REGR_SXX':
        aux[as] = null;
        aggr.push({ [as]: regrVarExpr(aux, 1, args, from) });
        break;
      case 'REGR_SXY':
        aux[as] = null;
        aggr.push({ [as]: covarianceExpr(aux, args, from, null) });
        break;
      case 'REGR_SLOPE':
        aux[as] = null;
        aggr.push({ [as]: regrSlopeExpr(aux, args, from) });
        break;
      case 'REGR_INTERCEPT':
        aux[as] = null;
        aggr.push({ [as]: regrInterceptExpr(aux, args, from) });
        break;
      case 'REGR_R2':
        aux[as] = null;
        aggr.push({ [as]: agg`(${corrExpr(aux, args, from)}) ** 2` });
        break;

      // aggregates that commute directly
      case 'MAX':
      case 'MIN':
      case 'BIT_AND':
      case 'BIT_OR':
      case 'BIT_XOR':
      case 'BOOL_AND':
      case 'BOOL_OR':
      case 'PRODUCT':
        aggr.push({ [as]: agg`${op}("${as}")` });
        break;

      // otherwise, check if dimension
      default:
        if (g.has(as)) dims.push(as);
        else return null; // unsupported aggregate
    }
  }

  return { from, dims, aggr, aux };
}

/**
 * Generate an output column name for use as an auxiliary column
 * (e.g., for sufficient statistics) within a data cube index.
 * @param {string} type The operation type.
 * @param  {...any} args The input column arguments.
 * @returns {string} A sanitized auxiliary column name.
 */
function auxName(type, ...args) {
  const cols = args.length ? '_' + args.map(sanitize).join('_') : '';
  return `__${type}${cols}__`;
}

/**
 * Sanitize a table column reference as a "safe" string value to
 * use as part of derived column names.
 * @param {*} col The source data table column. This may be a string,
 *  column reference, SQL expression, or other string-coercible value.
 * @returns {string} The sanitized column name.
 */
function sanitize(col) {
  return `${col}`
    .replaceAll('"', '')
    .replaceAll(' ', '_');
}

/**
 * Identify a single base (source) table of a query.
 * @param {Query} query The input query.
 * @returns {string | undefined | NaN} the base table name, or
 *  `undefined` if there is no source table, or `NaN` if the
 *  query operates over multiple source tables.
 */
function getBaseTable(query) {
  const subq = query.subqueries;

  // select query
  if (query.select) {
    const from = query.from();
    // @ts-ignore
    if (!from.length) return undefined;
    if (subq.length === 0) return from[0].from.table;
  }

  // handle set operations / subqueries
  const base = getBaseTable(subq[0]);
  for (let i = 1; i < subq.length; ++i) {
    const from = getBaseTable(subq[i]);
    if (from === undefined) continue;
    if (from !== base) return NaN;
  }
  return base;
}

/**
 * Generate an expression for calculating counts over data partitions.
 * As a side effect, this method adds a column to the input *aux* object
 * to track the count of non-null values per-partition.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {any} arg Source data table column. This value may be a string,
 *  column reference, SQL expression, or other string-coercible value.
 * @returns An aggregate expression for calculating counts over
 *  pre-aggregated data partitions.
 */
function countExpr(aux, arg) {
  const n = auxName('count', arg);
  aux[n] = agg`COUNT(${arg})`;
  return agg`SUM(${n})`.annotate({ name: n });
}

/**
 * Generate an expression for calculating averages over data partitions.
 * As a side effect, this method adds a column to the input *aux* object
 * to track the count of non-null values per-partition.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {string} as The output column for the original aggregate.
 * @param {any} arg Source data table column. This value may be a string,
 *  column reference, SQL expression, or other string-coercible value.
 * @returns An aggregate expression for calculating averages over
 *  pre-aggregated data partitions.
 */
function avgExpr(aux, as, arg) {
  const n = countExpr(aux, arg);
  return agg`(SUM("${as}" * ${n.name}) / ${n})`;
}

/**
 * Generate a scalar subquery for a global average.
 * This value can be used to mean-center data.
 * @param {*} x Souce data table column.
 * @param {string} from The source data table name.
 * @returns A scalar aggregate query
 */
function avg(x, from) {
  return sql`(SELECT AVG(${x}) FROM "${from}")`;
}

/**
 * Generate an expression for calculating argmax over data partitions.
 * As a side effect, this method adds a column to the input *aux* object
 * to track a maximum value per-partition.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {string} as The output column for the original aggregate.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @returns An aggregate expression for calculating argmax over
 *  pre-aggregated data partitions.
 */
function argmaxExpr(aux, as, [, y]) {
  const max = auxName('max', y);
  aux[max] = agg`MAX(${y})`;
  return agg`ARG_MAX("${as}", ${max})`;
}

/**
 * Generate an expression for calculating argmin over data partitions.
 * As a side effect, this method adds a column to the input *aux* object
 * to track a minimum value per-partition.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {string} as The output column for the original aggregate.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @returns An aggregate expression for calculating argmin over
 *  pre-aggregated data partitions.
 */
function argminExpr(aux, as, [, y]) {
  const min = auxName('min', y);
  aux[min] = agg`MIN(${y})`;
  return agg`ARG_MIN("${as}", ${min})`;
}

/**
 * Generate an expression for calculating variance over data partitions.
 * This method uses the "textbook" definition of variance (E[X^2] - E[X]^2),
 * but on mean-centered data to reduce floating point error. The variance
 * calculation uses three sufficient statistics: the count of non-null values,
 * the residual sum of squares and the sum of residual (mean-centered) values.
 * As a side effect, this method adds columns for these statistics to the
 * input *aux* object.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {*} x The source data table column. This may be a string,
 *  column reference, SQL expression, or other string-coercible value.
 * @param {string} from The source data table name.
 * @param {boolean} [correction=true] A flag for whether a Bessel
 *  correction should be applied to compute the sample variance
 *  rather than the populatation variance.
 * @returns An aggregate expression for calculating variance over
 *  pre-aggregated data partitions.
 */
function varianceExpr(aux, x, from, correction = true) {
  const n = countExpr(aux, x);
  const ssq = auxName('rssq', x); // residual sum of squares
  const sum = auxName('rsum', x); // residual sum
  const delta = sql`${x} - ${avg(x, from)}`;
  aux[ssq] = agg`SUM((${delta}) ** 2)`;
  aux[sum] = agg`SUM(${delta})`;
  const adj = correction ? ` - 1` : ''; // Bessel correction
  return agg`(SUM(${ssq}) - (SUM(${sum}) ** 2 / ${n})) / (${n}${adj})`;
}

/**
 * Generate an expression for calculating covariance over data partitions.
 * This method uses mean-centered data to reduce floating point error. The
 * covariance calculation uses four sufficient statistics: the count of
 * non-null value pairs, the sum of residual products, and residual sums
 * (of mean-centered values) for x and y. As a side effect, this method
 * adds columns for these statistics to the input *aux* object.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @param {string} from The source data table name.
 * @param {boolean|null} [correction=true] A flag for whether a Bessel
 *  correction should be applied to compute the sample covariance rather
 *  than the populatation covariance. If null, an expression for the
 *  unnormalized covariance (no division by sample count) is returned.
 * @returns An aggregate expression for calculating covariance over
 *  pre-aggregated data partitions.
 */
function covarianceExpr(aux, args, from, correction = true) {
  const n = regrCountExpr(aux, args);
  const sxy = regrSumXYExpr(aux, args, from);
  const sx = regrSumExpr(aux, 1, args, from);
  const sy = regrSumExpr(aux, 0, args, from);
  const adj = correction === null ? ''  // do not divide by count
    : correction ? ` / (${n} - 1)` // Bessel correction (sample)
    : ` / ${n}`;                   // no correction (population)
  return agg`(${sxy} - ${sx} * ${sy} / ${n})${adj}`;
}

/**
 * Generate an expression for calculating Pearson product-moment correlation
 * coefficients over data partitions. This method uses mean-centered data
 * to reduce floating point error. The correlation calculation uses six
 * sufficient statistics: the count of non-null value pairs, the sum of
 * residual products, and both residual sums and sums of squares for x and y.
 * As a side effect, this method adds columns for these statistics to the
 * input *aux* object.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @param {string} from The source data table name.
 * @returns An aggregate expression for calculating correlation over
 *  pre-aggregated data partitions.
 */
function corrExpr(aux, args, from) {
  const n = regrCountExpr(aux, args);
  const sxy = regrSumXYExpr(aux, args, from);
  const sxx = regrSumSqExpr(aux, 1, args, from);
  const syy = regrSumSqExpr(aux, 0, args, from);
  const sx = regrSumExpr(aux, 1, args, from);
  const sy = regrSumExpr(aux, 0, args, from);
  const vx = agg`(${sxx} - (${sx} ** 2) / ${n})`;
  const vy = agg`(${syy} - (${sy} ** 2) / ${n})`;
  return agg`(${sxy} - ${sx} * ${sy} / ${n}) / SQRT(${vx} * ${vy})`;
}

/**
 * Generate an expression for the count of non-null (x, y) pairs. As a side
 * effect, this method adds columns to the input *aux* object to the
 * partition-level count of non-null pairs.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @returns An aggregate expression for calculating regression pair counts
 *  over pre-aggregated data partitions.
 */
function regrCountExpr(aux, [y, x]) {
  const n = auxName('count', y, x);
  aux[n] = agg`REGR_COUNT(${y}, ${x})`;
  return agg`SUM(${n})`.annotate({ name: n });
}

/**
 * Generate an expression for calculating sums of residual values for use in
 * covariance and regression queries. Only values corresponding to non-null
 * (x, y) pairs are included. This method uses mean-centered data to reduce
 * floating point error. As a side effect, this method adds a column for
 * partition-level sums to the input *aux* object.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {number} i An index indicating which argument column to sum.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @param {string} from The source data table name.
 * @returns An aggregate expression over pre-aggregated data partitions.
 */
function regrSumExpr(aux, i, args, from) {
  const v = args[i];
  const o = args[1 - i];
  const sum = auxName('rs', v);
  aux[sum] = agg`SUM(${v} - ${avg(v, from)}) FILTER (${o} IS NOT NULL)`;
  return agg`SUM(${sum})`
}

/**
 * Generate an expressios for calculating sums of squared residual values for
 * use in covariance and regression queries. Only values corresponding to
 * non-null (x, y) pairs are included. This method uses mean-centered data to
 * reduce floating point error. As a side effect, this method adds a column
 * for partition-level sums to the input *aux* object.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {number} i An index indicating which argument column to sum.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @param {string} from The source data table name.
 * @returns An aggregate expression over pre-aggregated data partitions.
 */
function regrSumSqExpr(aux, i, args, from) {
  const v = args[i];
  const u = args[1 - i];
  const ssq = auxName('rss', v);
  aux[ssq] = agg`SUM((${v} - ${avg(v, from)}) ** 2) FILTER (${u} IS NOT NULL)`;
  return agg`SUM(${ssq})`
}

/**
 * Generate an expression for calculating sums of residual product values for
 * use in covariance and regression queries. Only values corresponding to
 * non-null (x, y) pairs are included. This method uses mean-centered data to
 * reduce floating point error. As a side effect, this method adds a column
 * for partition-level sums to the input *aux* object.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @param {string} from The source data table name.
 * @returns An aggregate expression over pre-aggregated data partitions.
 */
function regrSumXYExpr(aux, args, from) {
  const [y, x] = args;
  const sxy = auxName('sxy', y, x);
  aux[sxy] = agg`SUM((${x} - ${avg(x, from)}) * (${y} - ${avg(y, from)}))`;
  return agg`SUM(${sxy})`;
}

/**
 * Generate an expression for the average x value in a regression context.
 * Only values corresponding to non-null (x, y) pairs are included. As a side
 * effect, this method adds columns to the input *aux* object to track both
 * the count of non-null pairs and partition-level averages.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @returns An aggregate expression over pre-aggregated data partitions.
 */
function regrAvgXExpr(aux, args) {
  const [y, x] = args;
  const n = regrCountExpr(aux, args);
  const a = auxName('avg', x, y);
  aux[a] = agg`REGR_AVGX(${y}, ${x})`;
  return agg`(SUM(${a} * ${n.name}) / ${n})`;
}

/**
 * Generate an expression for the average y value in a regression context.
 * Only values corresponding to non-null (x, y) pairs are included. As a side
 * effect, this method adds columns to the input *aux* object to track both
 * the count of non-null pairs and partition-level averages.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @returns An aggregate expression over pre-aggregated data partitions.
 */
function regrAvgYExpr(aux, args) {
  const [y, x] = args;
  const n = regrCountExpr(aux, args);
  const a = auxName('avg', y, x);
  aux[a] = agg`REGR_AVGY(${y}, ${x})`;
  return agg`(SUM(${a} * ${n.name}) / ${n})`;
}

/**
 * Generate an expression for calculating variance over data partitions for
 * use in covariance and regression queries. Only values corresponding to
 * non-null (x, y) pairs are included. This method uses mean-centered data to
 * reduce floating point error. As a side effect, this method adds columns
 * for partition-level count and sums to the input *aux* object.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {number} i The index of the argument to compute the variance for.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @param {string} from The source data table name.
 * @returns An aggregate expression for calculating variance over
 *  pre-aggregated data partitions.
 */
function regrVarExpr(aux, i, args, from) {
  const n = regrCountExpr(aux, args);
  const sum = regrSumExpr(aux, i, args, from);
  const ssq = regrSumSqExpr(aux, i, args, from);
  return agg`(${ssq} - (${sum} ** 2 / ${n}))`;
}

/**
 * Generate an expression for calculating a regression slope. The slope is
 * computed as the covariance divided by the variance of the x variable. As a
 * side effect, this method adds columns for sufficient statistics to the
 * input *aux* object.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @param {string} from The source data table name.
 * @returns An aggregate expression for calculating regression slopes over
 *  pre-aggregated data partitions.
 */
function regrSlopeExpr(aux, args, from) {
  const cov = covarianceExpr(aux, args, from, null);
  const varx = regrVarExpr(aux, 1, args, from);
  return agg`(${cov}) / ${varx}`;
}

/**
 * Generate an expression for calculating a regression intercept. The intercept
 * is derived from the regression slope and average x and y values. As a
 * side effect, this method adds columns for sufficient statistics to the
 * input *aux* object.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @param {string} from The source data table name.
 * @returns An aggregate expression for calculating regression intercepts over
 *  pre-aggregated data partitions.
 */
function regrInterceptExpr(aux, args, from) {
  const ax = regrAvgXExpr(aux, args);
  const ay = regrAvgYExpr(aux, args);
  const m = regrSlopeExpr(aux, args, from);
  return agg`${ay} - (${m}) * ${ax}`;
}
