import { Query, sql } from '@uwdata/mosaic-sql';
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
      case 'REGR_COUNT':
        // TODO: revisit this DOUBLE cast in the future
        // for now, this sidesteps client-side conversions
        // of bignum and fixed decimal types to JS numbers
        aggr.push({ [as]: sql`SUM("${as}")::DOUBLE` });
        break;
      case 'AVG':
        aggr.push({ [as]: avgExpr(aux, as, args) });
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
        aggr.push({ [as]: sql`SQRT(${varianceExpr(aux, args[0], from)})` });
        break;
      case 'STDDEV_POP':
        aux[as] = null;
        aggr.push({ [as]: sql`SQRT(${varianceExpr(aux, args[0], from, false)})` });
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
      case 'REGR_AVGX':
        aggr.push({ [as]: regrAvgExpr(aux, as, args) });
        break;
      case 'REGR_AVGY':
        aggr.push({ [as]: regrAvgExpr(aux, as, args) });
        break;
      case 'REGR_SYY':
        aux[as] = null;
        aggr.push({ [as]: regrVarExpr(aux, 0, args, from) });
        break;
      case 'REGR_SXX':
        aux[as] = null;
        aggr.push({ [as]: regrVarExpr(aux, 1, args, from) });
        break;
      case 'REGR_SLOPE':
        aux[as] = null;
        aggr.push({ [as]: regrSlopeExpr(aux, args, from) });
        break;
      case 'REGR_INTERCEPT':
        aux[as] = null;
        aggr.push({ [as]: regrInterceptExpr(aux, args, from) });
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
        aggr.push({ [as]: sql`${op}("${as}")` });
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
 * Generate expressions for calculating averages over data partitions.
 * As a side effect, this method adds a column to the input *aux* object
 * to track the count of non-null values per-partition.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {string} as The output column for the original aggregate.
 * @param {[any]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @returns An aggregate expression for calculating argmax over
 *  pre-aggregated data partitions.
 */
function avgExpr(aux, as, [x]) {
  const n = auxName('count', x);
  aux[n] = sql`COUNT(${x})`;
  return sql`(SUM("${as}" * ${n}) / SUM(${n}))`;
}

/**
 * Generate expressions for calculating argmax over data partitions.
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
  aux[max] = sql`MAX(${y})`;
  return sql`ARG_MAX("${as}", ${max})`;
}

/**
 * Generate expressions for calculating argmin over data partitions.
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
  aux[min] = sql`MIN(${y})`;
  return sql`ARG_MIN("${as}", ${min})`;
}

/**
 * Generate expressions for calculating variance over data partitions.
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
  const adj = correction ? ` - 1` : ''; // Bessel correction
  const xn = sanitize(x);
  const n = auxName('count', xn);  // count, excluding null values
  const ssq = auxName('rssq', xn); // residual sum of squares
  const sum = auxName('rsum', xn); // residual sum
  const ux = sql`(SELECT AVG(${x}) FROM "${from}")`; // to mean-center data
  aux[n] = sql`COUNT(${x})`;
  aux[ssq] = sql`SUM((${x} - ${ux}) ** 2)`;
  aux[sum] = sql`SUM(${x} - ${ux})`;
  return sql`(SUM(${ssq}) - (SUM(${sum}) ** 2 / SUM(${n}))) / (SUM(${n})${adj})`;
}

/**
 * Generate expressions for calculating covariance over data partitions.
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
function covarianceExpr(aux, [y, x], from, correction = true) {
  const xn = sanitize(x);
  const yn = sanitize(y);
  const n = auxName('count', yn, xn); // count, excluding null values
  const sxy = auxName('sxy', yn, xn); // residual sum of squares
  const sx = auxName('rs', xn);       // residual sum
  const sy = auxName('rs', yn);       // residual sum
  const ux = sql`(SELECT AVG(${x}) FROM "${from}")`; // to mean-center data
  const uy = sql`(SELECT AVG(${y}) FROM "${from}")`; // to mean-center data
  aux[n] = sql`REGR_COUNT(${y}, ${x})`;
  aux[sxy] = sql`SUM((${x} - ${ux}) * (${y} - ${uy}))`;
  aux[sx] = sql`SUM(${x} - ${ux}) FILTER (${y} IS NOT NULL)`;
  aux[sy] = sql`SUM(${y} - ${uy}) FILTER (${x} IS NOT NULL)`;
  const adj = correction === null ? ''  // do not divide by count
    : correction ? ` / (SUM(${n}) - 1)` // Bessel correction (sample)
    : ` / SUM(${n})`;                   // no correction (population)
  return sql`(SUM(${sxy}) - SUM(${sx}) * SUM(${sy}) / SUM(${n}))${adj}`;
}

/**
 * Generate expressions for calculating correlation over data partitions.
 * This method uses mean-centered data to reduce floating point error. The
 * correlation calculation uses six sufficient statistics: the count of
 * non-null value pairs, the sum of residual products, residual sums and
 * sums of squres (of mean-centered values) for x and y. As a side effect,
 * this method adds columns for these statistics to the input *aux* object.
 * @param {object} aux An object for auxiliary columns (such as
 *  sufficient statistics) to include in the data cube aggregation.
 * @param {any[]} args Source data table columns. The entries may be strings,
 *  column references, SQL expressions, or other string-coercible values.
 * @param {string} from The source data table name.
 * @returns An aggregate expression for calculating correlation over
 *  pre-aggregated data partitions.
 */
function corrExpr(aux, [y, x], from) {
  const xn = sanitize(x);
  const yn = sanitize(y);
  const n = auxName('count', yn, xn); // count, excluding null values
  const sxy = auxName('sxy', yn, xn); // residual sum of squares
  const sxx = auxName('rss', xn);     // residual sum of squares
  const syy = auxName('rss', yn);     // residual sum of squares
  const sx = auxName('rs', xn);       // residual sum
  const sy = auxName('rs', yn);       // residual sum
  const ux = sql`(SELECT AVG(${x}) FROM "${from}")`; // to mean-center data
  const uy = sql`(SELECT AVG(${y}) FROM "${from}")`; // to mean-center data
  aux[n] = sql`REGR_COUNT(${y}, ${x})`;
  aux[sxy] = sql`SUM((${x} - ${ux}) * (${y} - ${uy}))`;
  aux[sxx] = sql`SUM((${x} - ${ux}) ** 2) FILTER (${y} IS NOT NULL)`;
  aux[syy] = sql`SUM((${y} - ${uy}) ** 2) FILTER (${x} IS NOT NULL)`;
  aux[sx] = sql`SUM(${x} - ${ux}) FILTER (${y} IS NOT NULL)`;
  aux[sy] = sql`SUM(${y} - ${uy}) FILTER (${x} IS NOT NULL)`;
  const numer = sql`(SUM(${sxy}) - SUM(${sx}) * SUM(${sy}) / SUM(${n}))`;
  const vx = sql`SUM(${sxx}) - (SUM(${sx}) ** 2) / SUM(${n})`;
  const vy = sql`SUM(${syy}) - (SUM(${sy}) ** 2) / SUM(${n})`;
  return sql`${numer} / SQRT((${vx}) * (${vy}))`;
}

function regrAvgExpr(aux, as, [y, x]) {
  const xn = sanitize(x);
  const yn = sanitize(y);
  const n = auxName('count', yn, xn); // count, excluding null values
  aux[n] = sql`REGR_COUNT(${y}, ${x})`;
  return sql`(SUM("${as}" * ${n}) / SUM(${n}))`;
}

function regrVarExpr(aux, i, args, from) {
  const nn = args.map(sanitize).slice(0, 2);
  const z = args[i];
  const o = args[1 - i];
  const zn = nn[i];
  const n = auxName('count', ...nn); // count, excluding null values
  const ssq = auxName('rss', zn);    // residual sum of squares
  const sum = auxName('rs', zn);     // residual sum
  const uz = sql`(SELECT AVG(${z}) FROM "${from}")`; // to mean-center data
  aux[n] = sql`REGR_COUNT(${args[1]}, ${args[0]})`;
  aux[ssq] = sql`SUM((${z} - ${uz}) ** 2) FILTER (${o} IS NOT NULL)`;
  aux[sum] = sql`SUM(${z} - ${uz})  FILTER (${o} IS NOT NULL)`;
  return sql`(SUM(${ssq}) - (SUM(${sum}) ** 2 / SUM(${n})))`;
}

function regrSlopeExpr(aux, args, from) {
  const cov = covarianceExpr(aux, args, from, null);
  const varx = regrVarExpr(aux, 1, args, from);
  return sql`(${cov}) / ${varx}`;
}

function regrInterceptExpr(aux, args, from) {
  const [y, x] = args;
  const xn = sanitize(x);
  const yn = sanitize(y);
  const n = auxName('count', yn, xn);
  const ax = auxName('avg', xn, yn);
  const ay = auxName('avg', yn, xn);
  aux[ax] = sql`REGR_AVGX(${y}, ${x})`;
  aux[ay] = sql`REGR_AVGY(${y}, ${x})`;
  const cov = covarianceExpr(aux, args, from, null);
  const varx = regrVarExpr(aux, 1, args, from);
  return sql`SUM(${ay} * ${n}) / SUM(${n}) - ((${cov}) / ${varx}) * (SUM(${ax} * ${n}) / SUM(${n}))`;
}
