import { Query, and, asNode, ceil, collectColumns, createTable, float64, floor, isBetween, int32, mul, round, scaleTransform, sub, isSelectQuery, ExprNode, SelectQuery } from '@uwdata/mosaic-sql';
import { preaggColumns } from './preagg-columns.js';
import { fnv_hash } from '../util/hash.js';

const Skip = { skip: true, result: null };

/**
 * @typedef {object} PreAggregateOptions
 * @property {string} [schema] Database schema (namespace) in which to write
 *  pre-aggregated materialzied views (default 'mosaic').
 * @property {boolean} [options.enabled=true] Flag to enable or disable the
 *  pre-aggregation. This flag can be updated later via the `enabled` property.
 */

/**
 * Build and query optimized pre-aggregated materaialized views, for fast
 * computation of groupby aggregate queries over compatible client queries
 * and selections. The materialized views contains pre-aggregated data for a
 * Mosaic client, subdivided by possible query values from an active selection
 * clause. These materialized views are database tables that can be queried
 * for rapid updates.
 *
 * Compatible client queries must consist of only groupby dimensions and
 * supported aggregate functions. Compatible selections must contain an active
 * clause that exposes metadata for an interval or point value predicate.
 *
 * Materialized views are written to a dedicated schema (namespace) that
 * can be set using the *schema* constructor option. This schema acts as a
 * persistent cache, and materialized view tables may be used across sessions.
 * The `dropSchema` method issues a query to remove *all* tables within this
 * schema. This may be needed if the original tables have updated data, but
 * should be used with care.
 */
export class PreAggregator {
  /**
   * Create a new manager of materialized views of pre-aggregated data.
   * @param {import('../Coordinator.js').Coordinator} coordinator A Mosaic coordinator.
   * @param {PreAggregateOptions} [options] Pre-aggregation options.
   */
  constructor(coordinator, {
    schema = 'mosaic',
    enabled = true
  } = {}) {
    /** @type {Map<import('../MosaicClient.js').MosaicClient, PreAggregateInfo | Skip | null>} */
    this.entries = new Map();
    this.active = null;
    this.mc = coordinator;
    this._schema = schema;
    this._enabled = enabled;
  }

  /**
   * Set the enabled state of this manager. If false, any local state is
   * cleared and subsequent request calls will return null until re-enabled.
   * This method has no effect on any pre-aggregated tables already in the
   * database.
   * @param {boolean} [state] The enabled state to set.
   */
  set enabled(state) {
    if (this._enabled !== state) {
      if (!state) this.clear();
      this._enabled = state;
    }
  }

  /**
   * Get the enabled state of this manager.
   * @returns {boolean} The current enabled state.
   */
  get enabled() {
    return this._enabled;
  }

  /**
   * Set the database schema used for pre-aggregated materialized view tables.
   * Upon changes, any local state is cleared. This method does _not_ drop any
   * existing materialized views, use `dropSchema` before changing the schema
   * to also remove existing materalized views in the database.
   * @param {string} [schema] The schema name to set.
   */
  set schema(schema) {
    if (this._schema !== schema) {
      this.clear();
      this._schema = schema;
    }
  }

  /**
   * Get the database schema used for pre-aggregated materialized view tables.
   * @returns {string} The current schema name.
   */
  get schema() {
    return this._schema;
  }

  /**
   * Issues a query through the coordinator to drop the current schema for
   * pre-aggregated materialized views. *All* materialized view tables in the
   * schema will be removed and local state is cleared. Call this method if
   * the underlying base tables have been updated, causing materialized view
   * to become stale and inaccurate. Use this method with care! Once dropped,
   * the schema will be repopulated by future pre-aggregation requests.
   * @returns A query result promise.
   */
  dropSchema() {
    this.clear();
    return this.mc.exec(`DROP SCHEMA IF EXISTS "${this.schema}" CASCADE`);
  }

  /**
   * Clear the cache of pre-aggregation entries for the current active
   * selection clause. This method does _not_ drop any existing materialized
   * views. Use `dropSchema` to remove existing materialized view tables from
   * the database.
   */
  clear() {
    this.entries.clear();
    this.active = null;
  }

  /**
   * Return pre-aggregation information for the active state of a
   * client-selection pair, or null if the client has unstable filters.
   * This method has multiple possible side effects, including materialized
   * view creation and updating internal caches.
   * @param {import('../MosaicClient.js').MosaicClient} client A Mosaic client.
   * @param {import('../Selection.js').Selection} selection A Mosaic selection
   *  to filter the client by.
   * @param {import('../util/selection-types.js').SelectionClause} activeClause
   *  A representative active selection clause for which to (possibly) generate
   *  materialized views of pre-aggregates.
   * @returns {PreAggregateInfo | Skip | null} Information and query generator
   * for pre-aggregated tables, or null if the client has unstable filters.
   */
  request(client, selection, activeClause) {
    // if not enabled, do nothing
    if (!this.enabled) return null;

    const { entries, mc, schema } = this;
    const { source } = activeClause;

    // if there is no clause source to track, do nothing
    if (!source) return null;

    // if we have cached active columns, check for updates or exit
    if (this.active) {
      // if the active clause source has changed, clear the state
      // this cancels outstanding requests and clears the local cache
      // a clear also sets this.active to null
      if (this.active.source !== source) this.clear();
      // if we've seen this source and it has unstable filters, do nothing
      if (this.active?.source === null) return null;
    }

    // the current active columns cache value
    let { active } = this;

    // if cached active columns are unset, analyze the active clause
    if (!active) {
      // generate active dimension columns to select over
      // will return an object with null source if it has unstable filters
      this.active = active = activeColumns(activeClause);
      // if the active clause has unstable filters, exit now
      if (active.source === null) return null;
    }

    // if we have cached pre-aggregate info, return that
    if (entries.has(client)) {
      return entries.get(client);
    }

    // get non-active materialized view columns
    const preaggCols = preaggColumns(client);

    let info;
    if (!preaggCols) {
      // if client is not indexable, record null info
      info = null;
    } else if (selection.skip(client, activeClause)) {
      // skip client if untouched by cross-filtering
      info = Skip;
    } else {
      // generate materialized view table
      const filter = selection.remove(source).predicate(client);
      info = preaggregateInfo(client.query(filter), active, preaggCols, schema);
      info.result = mc.exec([
        `CREATE SCHEMA IF NOT EXISTS ${schema}`,
        createTable(info.table, info.create, { temp: false })
      ]);
      info.result.catch(e => mc.logger().error(e));
    }

    entries.set(client, info);
    return info;
  }
}

/**
 * Determines the active dimension columns to select over. Returns an object
 * with the clause source, column definitions, and a predicate generator
 * function for the active dimensions of a pre-aggregated materialized view.
 * If the active clause is not indexable or is missing metadata, this method
 * returns an object with a null source property.
 * @param {import('../util/selection-types.js').SelectionClause} clause
 *  The active selection clause to analyze.
 */
function activeColumns(clause) {
  const { source, meta } = clause;
  const clausePred = clause.predicate;
  const clauseCols = collectColumns(clausePred).map(c => c.column);
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
      clauseCols.map(col => [`${col}`, asNode(col)])
    );
  } else if (type === 'interval' && scales) {
    // determine pixel-level binning
    const bins = scales.map(s => binInterval(s, pixelSize, bin));

    if (bins.some(b => !b)) {
      // bail if a scale type is unsupported
    } else if (bins.length === 1) {
      // selection clause predicate has type BetweenOpNode
      // single interval selection
      predicate = p => p ? isBetween('active0', p.extent.map(bins[0])) : [];
      // @ts-ignore
      columns = { active0: bins[0](clausePred.expr) };
    } else {
      // selection clause predicate has type AndNode<BetweenOpNode>
      // multiple interval selection
      predicate = p => p
        ? and(p.clauses.map(
            (c, i) => isBetween(`active${i}`, c.extent.map(bins[i]))
          ))
        : [];
      columns = Object.fromEntries(
        // @ts-ignore
        clausePred.clauses.map((p, i) => [`active${i}`, bins[i](p.expr)])
      );
    }
  }

  return { source: columns ? source : null, columns, predicate };
}

const BIN = { ceil, round };

/**
 * Returns a bin function generator to discretize a selection interval domain.
 * @param {import('../util/selection-types.js').Scale} scale A scale that maps
 *  domain values to the output range (typically pixels).
 * @param {number} pixelSize The interactive pixel size. This value indicates
 *  the bin step size and may be greater than an actual screen pixel.
 * @param {import('../util/selection-types.js').BinMethod} bin The binning
 *  method to apply, one of `floor`, `ceil', or `round`.
 * @returns {(value: any) => ExprNode} A bin function generator.
 */
function binInterval(scale, pixelSize, bin) {
  const { type, domain, range, apply, sqlApply } = scaleTransform(scale);
  if (!apply) return; // unsupported scale type
  const binFn = BIN[`${bin}`.toLowerCase()] || floor;
  const lo = apply(Math.min(...domain));
  const hi = apply(Math.max(...domain));
  const s = (type === 'identity'
    ? 1
    : Math.abs(range[1] - range[0]) / (hi - lo)) / pixelSize;
  const scalar = s === 1
    ? x => x
    : x => mul(float64(s), x);
  const diff = lo === 0
    ? x => x
    : x => sub(x, float64(lo));
  return value => int32(binFn(scalar(diff(sqlApply(value)))));
}

/**
 * Generate pre-aggregate query information.
 * @param {SelectQuery} clientQuery The original client query.
 * @param {ReturnType<activeColumns>} active Active (selected) columns.
 * @param {ReturnType<preaggColumns>} preaggCols Pre-aggregation columns.
 * @returns {PreAggregateInfo}
 */
function preaggregateInfo(clientQuery, active, preaggCols, schema) {
  const { group, output, preagg } = preaggCols;
  const { columns } = active;

  // build materialized view construction query
  const query = clientQuery
    .setSelect({ ...preagg, ...columns })
    .groupby(Object.keys(columns));

  // ensure active clause columns are selected by subqueries
  const [subq] = query.subqueries;
  if (subq) {
    const cols = Object.values(columns)
      .flatMap(c => collectColumns(c).map(c => c.column));
    subqueryPushdown(subq, cols);
  }

  // push any having or orderby criteria to output queries
  const having = query._having;
  const order = query._orderby;
  query._having = [];
  query._orderby = [];

  // generate creation query string and hash id
  const create = query.toString();
  const id = (fnv_hash(create) >>> 0).toString(16);
  const table = `${schema}.preagg_${id}`;

  // generate preaggregate select query
  const select = Query
    .select(group, output)
    .from(table)
    .groupby(group)
    .having(having)
    .orderby(order);

  return new PreAggregateInfo({ table, create, active, select });
}

/**
 * Push column selections down to subqueries.
 */
function subqueryPushdown(query, cols) {
  const memo = new Set;
  const pushdown = q => {
    if (memo.has(q)) return;
    memo.add(q);
    if (isSelectQuery(q) && q._from.length) {
      q.select(cols);
    }
    q.subqueries.forEach(pushdown);
  };
  pushdown(query);
}

/**
 * Metadata and query generator for materialized views of pre-aggregated data.
 * This object provides the information needed to generate and query the
 * materialized views for a client-selection pair relative to a specific
 * active clause and selection state.
 */
export class PreAggregateInfo {
  /**
   * Create a new pre-aggregation information instance.
   * @param {object} options Options object.
   * @param {string} options.table The materialized view table name.
   * @param {string} options.create The table creation query.
   * @param {*} options.active Active column information.
   * @param {SelectQuery} options.select Base query for requesting updates
   *  using a pre-aggregated materialized view.
   */
  constructor({ table, create, active, select }) {
    /**
     * The name of the materialized view.
     * @type {string}
     */
    this.table = table;
    /**
     * The SQL query used to generate the materialized view.
     * @type {string}
     */
    this.create = create;
    /**
     * A result promise returned for the materialized view creation query.
     * @type {Promise | null}
     */
    this.result = null;
    /**
     * Definitions and predicate function for the active columns,
     * which are dynamically filtered by the active clause.
     */
    this.active = active;
    /**
     * Select query (sans where clause) for materialized views.
     * @type {SelectQuery}
     */
    this.select = select;
    /**
     * Boolean flag indicating a client that should be skipped.
     * This value is always false for a created materialized view.
     * @type {boolean}
     */
    this.skip = false;
  }

  /**
   * Generate a materialized view query for the given predicate.
   * @param {import('@uwdata/mosaic-sql').ExprNode} predicate The current
   *  active clause predicate.
   * @returns {SelectQuery} A materialized view query.
   */
  query(predicate) {
    return this.select.clone().where(this.active.predicate(predicate));
  }
}
