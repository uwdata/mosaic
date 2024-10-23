import {
  Query, and, asColumn, createTable, isBetween, scaleTransform, sql
} from '@uwdata/mosaic-sql';
import { indexColumns } from './util/index-columns.js';
import { fnv_hash } from './util/hash.js';

const Skip = { skip: true, result: null };

/**
 * @typedef {object} IndexerOptions
 * @property {string} [schema] Database schema (namespace) in which to write
 *  the pre-aggregated materialzied views (indexes) to (default 'mosaic').
 * @property {boolean} [options.enabled=true] Flag to enable or disable the
 *  indexer. This setting can later be updated via the `enabled` method.
 */

/**
 * Build and query optimized pre-aggregated materaialized views, which we refer
 * to as *indexes* (not to be confused with indexes in databasees), for fast
 * computation of groupby aggregate queries over compatible client queries
 * and selections. The materialized views contains pre-aggregated data for a
 * Mosaic client, subdivided by possible query values from an active selection
 * clause. These materialized views are database tables that can be queried for
 * rapid updates.
 *
 * Compatible client queries must consist of only groupby dimensions and
 * supported aggregate functions. Compatible selections must contain an active
 * clause that exposes metadata for an interval or point value predicate.
 *
 * Materialized views are written to a dedicated schema (namespace) that
 * can be set using the *schema* constructor option. This schema acts as a
 * persistent cache, and index tables may be used across sessions. The
 * `dropMaterializedViews` method issues a query to remove *all* tables within
 * this schema. This may be needed if the original tables have updated data,
 * but should be used with care.
 */
export class Indexer {
  /**
   * Create a new indexer for materialized views of pre-aggregated data.
   * @param {import('./Coordinator.js').Coordinator} coordinator A Mosaic coordinator.
   * @param {IndexerOptions} [options] Indexer options.
   */
  constructor(coordinator, {
    schema = 'mosaic',
    enabled = true
  } = {}) {
    /** @type {Map<import('./MosaicClient.js').MosaicClient, PreAggregatesInfo | Skip | null>} */
    this.indexes = new Map();
    this.active = null;
    this.mc = coordinator;
    this._schema = schema;
    this._enabled = enabled;
  }

  /**
   * Set the enabled state of this indexer. If false, any local state is
   * cleared and subsequent index calls will return null until re-enabled.
   * This method has no effect on any index tables already in the database.
   * @param {boolean} [state] The enabled state to set.
   */
  set enabled(state) {
    if (this._enabled !== state) {
      if (!state) this.clear();
      this._enabled = state;
    }
  }

  /**
   * Get the enabled state of this indexer.
   * @returns {boolean} The current enabled state.
   */
  get enabled() {
    return this._enabled;
  }

  /**
   * Set the database schema used by this indexer. Upon changes, any local
   * state is cleared. This method does _not_ drop any existing materialized
   * views, use `dropMaterializedViews` before changing the schema to also
   * remove existing materalized views in the database.
   * @param {string} [schema] The schema name to set.
   */
  set schema(schema) {
    if (this._schema !== schema) {
      this.clear();
      this._schema = schema;
    }
  }

  /**
   * Get the database schema used by this indexer.
   * @returns {string} The current schema name.
   */
  get schema() {
    return this._schema;
  }

  /**
   * Issues a query through the coordinator to drop the current materialized
   * view schema. *All* materialized views in the schema will be removed and
   * local state is cleared. Call this method if the underlying base tables have
   * been updated, causing derived materialized views to become stale and
   * inaccurate. Use this method with care! Once dropped, the schema will be
   * repopulated by future indexer requests.
   * @returns A query result promise.
   */
  dropMaterializedViews() {
    this.clear();
    return this.mc.exec(`DROP SCHEMA IF EXISTS "${this.schema}" CASCADE`);
  }

  /**
   * Clear the cache of index entries for the current active
   * selection clause. This method does _not_ drop any existing materialized
   * views. Use `dropMaterializedViews` to remove existing materialized views
   * from the database.
   */
  clear() {
    this.indexes.clear();
    this.active = null;
  }

  /**
   * Return index information for the active state of a client-selection pair,
   * or null if the client is not indexable. This method has multiple possible
   * side effects, including materialized view generation and updating internal
   * caches.
   * @param {import('./MosaicClient.js').MosaicClient} client A Mosaic client.
   * @param {import('./Selection.js').Selection} selection A Mosaic selection
   *  to filter the client by.
   * @param {import('./util/selection-types.js').SelectionClause} activeClause
   *  A representative active selection clause for which to (possibly) generate
   *  materialized views of pre-aggregates.
   * @returns {PreAggregatesInfo | Skip | null} Information and query generator
   * for indexes, or null if the client is not indexable.
   */
  index(client, selection, activeClause) {
    // if not enabled, do nothing
    if (!this.enabled) return null;

    const { indexes, mc, schema } = this;
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
      // generate active dimension columns to select over
      // will return an object with null source if not indexable
      this.active = active = activeColumns(activeClause);
      // if the active clause is not indexable, exit now
      if (active.source === null) return null;
    }

    // if we have cached index info, return that
    if (indexes.has(client)) {
      return indexes.get(client);
    }

    // get non-active index columns
    const indexCols = indexColumns(client);

    let info;
    if (!indexCols) {
      // if client is not indexable, record null index
      info = null;
    } else if (selection.skip(client, activeClause)) {
      // skip client if untouched by cross-filtering
      info = Skip;
    } else {
      // generate materialized view
      const filter = selection.remove(source).predicate(client);
      info = preaggregateInfo(client.query(filter), active, indexCols, schema);
      info.result = mc.exec([
        `CREATE SCHEMA IF NOT EXISTS ${schema}`,
        createTable(info.table, info.create, { temp: false })
      ]);
      info.result.catch(e => mc.logger().error(e));
    }

    indexes.set(client, info);
    return info;
  }
}

/**
 * Determines the active dimension columns to select over. Returns an object
 * with the clause source, column definitions, and a predicate generator
 * function for the active dimensions of an index. If the active clause is not
 * indexable or is missing metadata, this method returns an object with a null
 * source property.
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
 * Generate pre-aggregate query information.
 * @param {Query} clientQuery The original client query.
 * @param {*} active Active (selected) column definitions.
 * @param {*} indexCols Pre-aggregate index column definitions.
 * @returns {PreAggregatesInfo}
 */
function preaggregateInfo(clientQuery, active, indexCols, schema) {
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

  // push orderby criteria to later queries
  const order = query.orderby();
  query.query.orderby = [];

  // generate creation query string and hash id
  const create = query.toString();
  const id = (fnv_hash(create) >>> 0).toString(16);
  const table = `${schema}.index_${id}`;

  // generate mpreaggregate select query
  const select = Query
    .select(dims, aggr)
    .from(table)
    .groupby(dims)
    .orderby(order);

  return new PreAggregatesInfo({ id, table, create, active, select });
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
 * Metadata and query generator for materialized views of pre-aggregated data.
 * This object provides the information needed to generate and query the
 * materialized views for a client-selection pair relative to a specific active
 * clause and selection state.
 */
export class PreAggregatesInfo {
  /**
   * Create a new MaterializedViewsInfo instance.
   * @param {object} options
   */
  constructor({ table, create, active, select } = {}) {
    /** The name of the materialized view. */
    this.table = table;
    /** The SQL query used to generate the materialized view. */
    this.create = create;
    /** A result promise returned for the materialized view creation query. */
    this.result = null;
    /**
     * Definitions and predicate function for the active columns,
     * which are dynamically filtered by the active clause.
     */
    this.active = active;
    /** Select query (sans where clause) for materialized views. */
    this.select = select;
    /**
     * Boolean flag indicating a client that should be skipped.
     * This value is always false for completed index info.
     */
    this.skip = false;
  }

  /**
   * Generate a materialized view query for the given predicate.
   * @param {import('@uwdata/mosaic-sql').SQLExpression} predicate The current
   *  active clause predicate.
   * @returns {Query} A materialized view query.
   */
  query(predicate) {
    return this.select.clone().where(this.active.predicate(predicate));
  }
}
