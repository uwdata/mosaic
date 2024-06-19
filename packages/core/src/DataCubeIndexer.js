import {
  Query, and, asColumn, create, isBetween, scaleTransform, sql
} from '@uwdata/mosaic-sql';
import { indexColumns } from './util/index-columns.js';
import { fnv_hash } from './util/hash.js';

const Skip = { skip: true, result: null };

/**
 * Build and query optimized indices ("data cubes") for fast computation of
 * groupby aggregate queries over compatible client queries and selections.
 * A data cube contains pre-aggregated data for a Mosaic client, subdivided
 * by possible query values from an active selection clause. These cubes are
 * realized as as database tables that can be queried for rapid updates.
 * Compatible client queries must consist of only groupby dimensions and
 * supported aggregate functions. Compatible selections must contain an active
 * clause that exposes metadata for an interval or point value predicate.
 */
export class DataCubeIndexer {
  /**
   * Create a new data cube index table manager.
   * @param {import('./Coordinator.js').Coordinator} coordinator A Mosaic coordinator.
   * @param {object} [options] Indexer options.
   * @param {boolean} [options.enabled=true] Flag to enable/disable indexer.
   * @param {boolean} [options.temp=true] Flag to indicate if generated data
   *  cube index tables should be temporary tables.
   */
  constructor(coordinator, {
    enabled = true,
    temp = true
  } = {}) {
    /** @type {Map<import('./MosaicClient.js').MosaicClient, DataCubeInfo | Skip | null>} */
    this.indexes = new Map();
    this.active = null;
    this.temp = temp;
    this.mc = coordinator;
    this._enabled = enabled;
  }

  /**
   * Set the enabled state of this indexer. If false, any cached state is
   * cleared and subsequent index calls will return null until re-enabled.
   * @param {boolean} state The enabled state.
   */
  enabled(state) {
    if (state === undefined) {
      return this._enabled;
    } else if (this._enabled !== state) {
      if (!state) this.clear();
      this._enabled = state;
    }
  }

  /**
   * Clear the cache of data cube index table entries for the current active
   * selection clause. This method will also cancel any queued data cube table
   * creation queries that have not yet been submitted to the database. This
   * method does _not_ drop any existing data cube tables.
   */
  clear() {
    this.mc.cancel(Array.from(this.indexes.values(), info => info?.result));
    this.indexes = new Map();
    this.active = null;
  }

  /**
   * Return data cube index table information for the active state of a
   * client-selection pair, or null if the client is not indexable. This
   * method has multiple possible side effects, including data cube table
   * generation and updating internal caches.
   * @param {import('./MosaicClient.js').MosaicClient} client A Mosaic client.
   * @param {import('./Selection.js').Selection} selection A Mosaic selection
   *  to filter the client by.
   * @param {import('./util/selection-types.js').SelectionClause} activeClause
   *  A representative active selection clause for which to (possibly) generate
   *  data cube index tables.
   * @returns {DataCubeInfo | Skip | null} Data cube index table
   *  information and query generator, or null if the client is not indexable.
   */
  index(client, selection, activeClause) {
    // if not enabled, do nothing
    if (!this._enabled) return null;

    const { indexes, mc, temp } = this;
    const { source } = activeClause;

    // if there is no clause source to track, do nothing
    if (!source) return null;

    // if we have cached active columns, check for updates or exit
    if (this.active) {
      // if the active clause source has changed, clear indexer state
      // this cancels outstanding requests and clears the index cache
      // a clear also sets this.active to null
      if (this.active.source !== source) this.clear();
      // if we've seen this source and it's not indexable, do nothing
      if (this.active?.source === null) return null;
    }

    // the current active columns cache value
    let { active } = this;

    // if cached active columns are unset, analyze the active clause
    if (!active) {
      // generate active data cube dimension columns to select over
      // will return an object with null source if not indexable
      this.active = active = activeColumns(activeClause);
      // if the active clause is not indexable, exit now
      if (active.source === null) return null;
    }

    // if we have cached data cube index table info, return that
    if (indexes.has(client)) {
      return indexes.get(client);
    }

    // get non-active data cube index table columns
    const indexCols = indexColumns(client);

    let info;
    if (!indexCols) {
      // if client is not indexable, record null index
      info = null;
    } else if (selection.skip(client, activeClause)) {
      // skip client if untouched by cross-filtering
      info = Skip;
    } else {
      // generate data cube index table
      const filter = selection.remove(source).predicate(client);
      info = dataCubeInfo(client.query(filter), active, indexCols);
      info.result = mc.exec(create(info.table, info.create, { temp }));
      info.result.catch(e => mc.logger().error(e));
    }

    indexes.set(client, info);
    return info;
  }
}

/**
 * Determines the active data cube dimension columns to select over. Returns
 * an object with the clause source, column definitions, and a predicate
 * generator function for the active dimensions of a data cube index table. If
 * the active clause is not indexable or is missing metadata, this method
 * returns an object with a null source property.
 * @param {import('./util/selection-types.js').SelectionClause} clause The
 *  active selection clause to analyze.
 */
function activeColumns(clause) {
  const { source, meta } = clause;
  const clausePred = clause.predicate;
  const clauseCols = clausePred?.columns;
  let predicate;
  let columns;

  if (!meta || !clauseCols) {
    return { source: null, columns, predicate };
  }

  // @ts-ignore
  const { type, scales, bin, pixelSize = 1 } = meta;

  if (type === 'point') {
    predicate = x => x;
    columns = Object.fromEntries(
      clauseCols.map(col => [`${col}`, asColumn(col)])
    );
  } else if (type === 'interval' && scales) {
    // determine pixel-level binning
    const bins = scales.map(s => binInterval(s, pixelSize, bin));

    if (bins.some(b => !b)) {
      // bail if a scale type is unsupported
    } else if (bins.length === 1) {
      // single interval selection
      predicate = p => p ? isBetween('active0', p.range.map(bins[0])) : [];
      // @ts-ignore
      columns = { active0: bins[0](clausePred.field) };
    } else {
      // multiple interval selection
      predicate = p => p
        ? and(p.children.map(
            ({ range }, i) => isBetween(`active${i}`, range.map(bins[i]))
          ))
        : [];
      columns = Object.fromEntries(
        // @ts-ignore
        clausePred.children.map((p, i) => [`active${i}`, bins[i](p.field)])
      );
    }
  }

  return { source: columns ? source : null, columns, predicate };
}

const BIN = { ceil: 'CEIL', round: 'ROUND' };

/**
 * Returns a bin function generator to discretize a selection interval domain.
 * @param {import('./util/selection-types.js').Scale} scale A scale that maps
 *  domain values to the output range (typically pixels).
 * @param {number} pixelSize The interactive pixel size. This value indicates
 *  the bin step size and may be greater than an actual screen pixel.
 * @param {import('./util/selection-types.js').BinMethod} bin The binning
 *  method to apply, one of `floor`, `ceil', or `round`.
 * @returns {(value: any) => import('@uwdata/mosaic-sql').SQLExpression}
 *  A bin function generator.
 */
function binInterval(scale, pixelSize, bin) {
  const { type, domain, range, apply, sqlApply } = scaleTransform(scale);
  if (!apply) return; // unsupported scale type
  const fn = BIN[`${bin}`.toLowerCase()] || 'FLOOR';
  const lo = apply(Math.min(...domain));
  const hi = apply(Math.max(...domain));
  const a = type === 'identity' ? 1 : Math.abs(range[1] - range[0]) / (hi - lo);
  const s = a / pixelSize === 1 ? '' : `${a / pixelSize}::DOUBLE * `;
  const d = lo === 0 ? '' : ` - ${lo}::DOUBLE`;
  return value => sql`${fn}(${s}(${sqlApply(value)}${d}))::INTEGER`;
}

/**
 * Generate data cube table query information.
 * @param {Query} clientQuery The original client query.
 * @param {*} active Active (selected) column definitions.
 * @param {*} indexCols Data cube index column definitions.
 * @returns {DataCubeInfo}
 */
function dataCubeInfo(clientQuery, active, indexCols) {
  const { dims, aggr, aux } = indexCols;
  const { columns } = active;

  // build index table construction query
  const query = clientQuery
    .select({ ...columns, ...aux })
    .groupby(Object.keys(columns));

  // ensure active clause columns are selected by subqueries
  const [subq] = query.subqueries;
  if (subq) {
    const cols = Object.values(columns).flatMap(c => c.columns);
    subqueryPushdown(subq, cols);
  }

  // push orderby criteria to later cube queries
  const order = query.orderby();
  query.query.orderby = [];

  // generate creation query string and hash id
  const create = query.toString();
  const id = (fnv_hash(create) >>> 0).toString(16);
  const table = `cube_index_${id}`;

  // generate data cube select query
  const select = Query
    .select(dims, aggr)
    .from(table)
    .groupby(dims)
    .orderby(order);

  return new DataCubeInfo({ table, create, active, select });
}

/**
 * Push column selections down to subqueries.
 */
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

/**
 * Metadata and query generator for a data cube index table. This
 * object provides the information needed to generate and query
 * a data cube index table for a client-selection pair relative to
 * a specific active clause and selection state.
 */
export class DataCubeInfo {
  /**
   * Create a new DataCubeInfo instance.
   * @param {object} options
   */
  constructor({ table, create, active, select } = {}) {
    /** The name of the data cube index table. */
    this.table = table;
    /** The SQL query used to generate the data cube index table. */
    this.create = create;
    /** A result promise returned for the data cube creation query. */
    this.result = null;
    /**
     * Definitions and predicate function for the active columns,
     * which are dynamically filtered by the active clause.
     */
    this.active = active;
    /** Select query (sans where clause) for data cube tables. */
    this.select = select;
    /**
     * Boolean flag indicating a client that should be skipped.
     * This value is always false for completed data cube info.
     */
    this.skip = false;
  }

  /**
   * Generate a data cube index table query for the given predicate.
   * @param {import('@uwdata/mosaic-sql').SQLExpression} predicate The current
   *  active clause predicate.
   * @returns {Query} A data cube index table query.
   */
  query(predicate) {
    return this.select.clone().where(this.active.predicate(predicate));
  }
}
