import { Query, and, create, isBetween, scaleTransform, sql } from '@uwdata/mosaic-sql';
import { MosaicClient } from './MosaicClient.js';
import { fnv_hash } from './util/hash.js';

/**
 * Build and query optimized indices ("data cubes") for fast computation of
 * groupby aggregate queries over compatible client queries and selections.
 * A data cube contains pre-aggregated data for a Mosaic client, subdivided
 * by possible query values from an active view. Indexes are realized as
 * as temporary database tables that can be queried for rapid updates.
 * Compatible client queries must pull data from the same backing table and
 * must consist of only groupby dimensions and supported aggregates.
 * Compatible selections must contain an active clause that exposes a schema
 * for an interval or point value predicate.
 */
export class DataCubeIndexer {
  /**
   *
   * @param {import('./Coordinator.js').Coordinator} mc a Mosaic coordinator
   * @param {*} options Options hash to configure the data cube indexes and pass selections to the coordinator.
   */
  constructor(mc, { selection, temp = true }) {
    /** @type import('./Coordinator.js').Coordinator */
    this.mc = mc;
    this.selection = selection;
    this.temp = temp;
    this.reset();
  }

  reset() {
    this.enabled = false;
    this.clients = null;
    this.indices = null;
    this.activeView = null;
  }

  clear() {
    if (this.indices) {
      this.mc.cancel(Array.from(this.indices.values(), index => index.result));
      this.indices = null;
    }
  }

  index(clients, active) {
    if (this.clients !== clients) {
      // test client views for compatibility
      const cols = Array.from(clients, getIndexColumns);
      const from = cols[0]?.from;
      this.enabled = cols.every(c => c && c.from === from);
      this.clients = clients;
      this.activeView = null;
      this.clear();
    }
    if (!this.enabled) return false; // client views are not indexable

    active = active || this.selection.active;
    const { source } = active;
    // exit early if indexes already set up for active view
    if (source && source === this.activeView?.source) return true;

    this.clear();
    if (!source) return false; // nothing to work with
    const activeView = this.activeView = getActiveView(active);
    if (!activeView) return false; // active selection clause not compatible

    const logger = this.mc.logger();
    logger.warn('DATA CUBE INDEX CONSTRUCTION');

    // create a selection with the active source removed
    const sel = this.selection.remove(source);

    // generate data cube indices
    const indices = this.indices = new Map;
    const { mc, temp } = this;
    for (const client of clients) {
      if (sel.skip(client, active)) continue;
      const index = getIndexColumns(client);

      // build index construction query
      const query = client.query(sel.predicate(client))
        .select({ ...activeView.columns, ...index.aux })
        .groupby(Object.keys(activeView.columns));

      // ensure active view columns are selected by subqueries
      const [subq] = query.subqueries;
      if (subq) {
        const cols = Object.values(activeView.columns).map(c => c.columns[0]);
        subqueryPushdown(subq, cols);
      }

      // push orderby criteria to later cube queries
      const order = query.orderby();
      query.query.orderby = [];

      const sql = query.toString();
      const id = (fnv_hash(sql) >>> 0).toString(16);
      const table = `cube_index_${id}`;
      const result = mc.exec(create(table, sql, { temp }));
      result.catch(e => logger.error(e));
      indices.set(client, { table, result, order, ...index });
    }

    // index creation successful
    return true;
  }

  async update() {
    const { clients, selection, activeView } = this;
    const filter = activeView.predicate(selection.active.predicate);
    return Promise.all(
      Array.from(clients).map(client => this.updateClient(client, filter))
    );
  }

  async updateClient(client, filter) {
    const index = this.indices.get(client);
    if (!index) return;

    if (!filter) {
      filter = this.activeView.predicate(this.selection.active.predicate);
    }

    const { table, dims, aggr, order = [] } = index;
    const query = Query
      .select(dims, aggr)
      .from(table)
      .groupby(dims)
      .where(filter)
      .orderby(order);
    return this.mc.updateClient(client, query);
  }
}

function getActiveView(clause) {
  const { source, schema } = clause;
  let columns = clause.predicate?.columns;
  if (!schema || !columns) return null;
  const { type, scales, pixelSize = 1 } = schema;
  let predicate;

  if (type === 'interval' && scales) {
    const bins = scales.map(s => binInterval(s, pixelSize));
    if (bins.some(b => b == null)) return null; // unsupported scale type

    if (bins.length === 1) {
      predicate = p => p ? isBetween('active0', p.range.map(bins[0])) : [];
      columns = { active0: bins[0](clause.predicate.field) };
    } else {
      predicate = p => p
        ? and(p.children.map(({ range }, i) => isBetween(`active${i}`, range.map(bins[i]))))
        : [];
      columns = Object.fromEntries(
        clause.predicate.children.map((p, i) => [`active${i}`, bins[i](p.field)])
      );
    }
  } else if (type === 'point') {
    predicate = x => x;
    columns = Object.fromEntries(columns.map(col => [col.toString(), col]));
  } else {
    return null; // unsupported type
  }

  return { source, columns, predicate };
}

function binInterval(scale, pixelSize) {
  const { apply, sqlApply } = scaleTransform(scale);
  if (apply) {
    const { domain, range } = scale;
    const lo = apply(Math.min(...domain));
    const hi = apply(Math.max(...domain));
    const a = (Math.abs(range[1] - range[0]) / (hi - lo)) / pixelSize;
    const s = pixelSize === 1 ? '' : `${pixelSize}::INTEGER * `;
    return value => sql`${s}FLOOR(${a}::DOUBLE * (${sqlApply(value)} - ${lo}::DOUBLE))::INTEGER`;
  }
}

const NO_INDEX = { from: NaN };

/**
 * Determine data cube index columns for a given Mosaic client.
 * @param {MosaicClient} client The Mosaic client.
 * @returns An object with necessary column data to generate data
 *  cube index columns, null if an invalid or unparseable expression
 * is encountered, or NO_INDEX if the client is not indexable.
 */
function getIndexColumns(client) {
  if (!client.filterIndexable) return NO_INDEX;
  const q = client.query();
  const from = getBaseTable(q);
  if (!from || !q.groupby) return NO_INDEX;
  const g = new Set(q.groupby().map(c => c.column));

  const aggr = [];
  const dims = [];
  const aux = {}; // auxiliary columns needed by aggregates
  let auxAs;

  for (const entry of q.select()) {
    const { as, expr: { aggregate, args } } = entry;
    const op = aggregate?.toUpperCase?.();
    switch (op) {
      case 'COUNT':
      case 'SUM':
        aggr.push({ [as]: sql`SUM("${as}")::DOUBLE` });
        break;
      case 'AVG':
        aux[auxAs = `__count_${sanitize(args[0])}__`] = sql`COUNT(${args[0]})`;
        aggr.push({ [as]: sql`(SUM("${as}" * ${auxAs}) / SUM(${auxAs}))::DOUBLE` });
        break;
      case 'ARG_MAX':
        aux[auxAs = `__max_${as}__`] = sql`MAX(${args[1]})`;
        aggr.push({ [as]: sql`ARG_MAX("${as}", ${auxAs})` });
        break;
      case 'ARG_MIN':
        aux[auxAs = `__min_${as}__`] = sql`MIN(${args[1]})`;
        aggr.push({ [as]: sql`ARG_MIN("${as}", ${auxAs})` });
        break;

      // variance statistics
      case 'VARIANCE':
      case 'VAR_SAMP':
      case 'VAR_POP':
        aux[as] = null; // omit original variance aggregate
        aggr.push({
          [as]: varianceExpr(aux, args[0], from, op !== 'VAR_POP')
        });
        break;
      case 'STDDEV':
      case 'STDDEV_SAMP':
      case 'STDDEV_POP':
        aux[as] = null; // omit original std. deviation aggregate
        aggr.push({
          [as]: sql`SQRT(${varianceExpr(aux, args[0], from, op !== 'STDDEV_POP')})`
        });
        break;
      case 'COVAR_SAMP':
      case 'COVAR_POP':
        aux[as] = null; // omit original covariance aggregate
        aggr.push({
          [as]: covarianceExpr(aux, args, from, op !== 'COVAR_POP')
        });
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
      default:
        if (g.has(as)) dims.push(as);
        else return null;
    }
  }

  return { from, dims, aggr, aux };
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
  const name = sanitize(x);
  const adj = correction ? ` - 1` : '';
  const n = `__count_${name}__`; // count, excluding null values
  const ssq = `__rssq_${name}__`; // residual sum of squares
  const sum = `__rsum_${name}__`; // residual sum
  const mean = sql`(SELECT AVG(${x}) FROM "${from}")`;
  aux[n] = sql`COUNT(${x})`;
  aux[ssq] = sql`SUM((${x} - ${mean}) ** 2)`;
  aux[sum] = sql`SUM(${x} - ${mean})`;
  // TODO: coalesce null values with 0, or leave that for downstream?
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
 * @param {boolean} [correction=true] A flag for whether a Bessel
 *  correction should be applied to compute the sample covariance
 *  rather than the populatation covariance.
 * @returns An aggregate expression for calculating covariance over
 *  pre-aggregated data partitions.
 */
function covarianceExpr(aux, [x, y], from, correction = true) {
  const xn = sanitize(x);
  const yn = sanitize(y);
  const adj = correction ? ` - 1` : '';
  const n = `__count_${xn}_${yn}__`; // count, excluding null values
  const sxy = `__sxy_${xn}_${yn}__`; // residual sum of squares
  const sx = `__sx_${xn}__`; // residual sum
  const sy = `__sy_${yn}__`; // residual sum
  const ux = sql`(SELECT AVG(${x}) FROM "${from}")`;
  const uy = sql`(SELECT AVG(${y}) FROM "${from}")`;
  aux[n] = sql`REGR_COUNT(${y}, ${x})`;
  aux[sxy] = sql`SUM((${x} - ${ux}) * (${y} - ${uy}))`;
  aux[sx] = sql`SUM(${x} - ${ux}) FILTER (${y} IS NOT NULL)`;
  aux[sy] = sql`SUM(${y} - ${uy}) FILTER (${x} IS NOT NULL)`;
  return sql`(SUM(${sxy}) - SUM(${sx}) * SUM(${sy}) / SUM(${n})) / (SUM(${n})${adj})`;
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

function getBaseTable(query) {
  const subq = query.subqueries;

  // select query
  if (query.select) {
    const from = query.from();
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

function subqueryPushdown(query, cols) {
  const memo = new Set;
  const pushdown = q => {
    if (memo.has(q)) return;
    memo.add(q);
    if (q.select && q.from().length) {
      q.select(cols);
    }
    q.subqueries.forEach(pushdown);
  };
  pushdown(query);
}
