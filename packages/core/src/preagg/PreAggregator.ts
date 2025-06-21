import type { ExprNode, ScaleOptions, SelectQuery, Query, ExprValue } from '@uwdata/mosaic-sql';
import type { Coordinator } from '../Coordinator.js';
import type { MosaicClient } from '../MosaicClient.js';
import type { Selection } from '../Selection.js';
import type { BinMethod, SelectionClause } from '../SelectionClause.js';
import { Query as QueryBuilder, and, asNode, ceil, collectColumns, createTable, float64, floor, isBetween, int32, mul, round, scaleTransform, sub, isSelectQuery, isAggregateExpression, ColumnNameRefNode } from '@uwdata/mosaic-sql';
import { preaggColumns } from './preagg-columns.js';
import { fnv_hash } from '../util/hash.js';

const Skip = { skip: true, result: null };

export interface PreAggregateOptions {
  /** Database schema (namespace) in which to write pre-aggregated materialized views (default 'mosaic'). */
  schema?: string;
  /** Flag to enable or disable the pre-aggregation. This flag can be updated later via the `enabled` property. */
  enabled?: boolean;
}

interface ActiveColumnsResult {
  source: any | null;
  columns?: Record<string, ExprNode>;
  predicate?: (p: any) => ExprNode | ExprNode[];
}

interface PreAggregateInfoOptions {
  table: string;
  create: string;
  active: ActiveColumnsResult;
  select: SelectQuery;
}

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
  public entries: Map<MosaicClient, PreAggregateInfo | typeof Skip | null>;
  private active: ActiveColumnsResult | null;
  private mc: Coordinator;
  private _schema: string;
  private _enabled: boolean;

  /**
   * Create a new manager of materialized views of pre-aggregated data.
   * @param coordinator A Mosaic coordinator.
   * @param options Pre-aggregation options.
   */
  constructor(coordinator: Coordinator, {
    schema = 'mosaic',
    enabled = true
  }: PreAggregateOptions = {}) {
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
   * @param state The enabled state to set.
   */
  set enabled(state: boolean) {
    if (this._enabled !== state) {
      if (!state) this.clear();
      this._enabled = state;
    }
  }

  /**
   * Get the enabled state of this manager.
   * @returns The current enabled state.
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * Set the database schema used for pre-aggregated materialized view tables.
   * Upon changes, any local state is cleared. This method does _not_ drop any
   * existing materialized views, use `dropSchema` before changing the schema
   * to also remove existing materalized views in the database.
   * @param schema The schema name to set.
   */
  set schema(schema: string) {
    if (this._schema !== schema) {
      this.clear();
      this._schema = schema;
    }
  }

  /**
   * Get the database schema used for pre-aggregated materialized view tables.
   * @returns The current schema name.
   */
  get schema(): string {
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
  dropSchema(): Promise<any> {
    this.clear();
    return this.mc.exec(`DROP SCHEMA IF EXISTS "${this.schema}" CASCADE`);
  }

  /**
   * Clear the cache of pre-aggregation entries for the current active
   * selection clause. This method does _not_ drop any existing materialized
   * views. Use `dropSchema` to remove existing materialized view tables from
   * the database.
   */
  clear(): void {
    this.entries.clear();
    this.active = null;
  }

  /**
   * Return pre-aggregation information for the active state of a
   * client-selection pair, or null if the client has unstable filters.
   * This method has multiple possible side effects, including materialized
   * view creation and updating internal caches.
   * @param client A Mosaic client.
   * @param selection A Mosaic selection to filter the client by.
   * @param activeClause A representative active selection
   *  clause for which to generate materialized views of pre-aggregates.
   * @returns Information and query generator
   * for pre-aggregated tables, or null if the client has unstable filters.
   */
  request(client: MosaicClient, selection: Selection, activeClause: SelectionClause | null): PreAggregateInfo | typeof Skip | null {
    // if not enabled, do nothing
    if (!this.enabled || activeClause == null) return null;

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
      // if active clause predicate is null, we can't analyze it
      // return null to backoff to standard client query
      // non-null clauses may come later, so don't set active state
      if (activeClause.predicate == null) return null;
      // generate active dimension columns to select over
      // will return an object with null source if it has unstable filters
      this.active = active = activeColumns(activeClause);
      // if the active clause has unstable filters, exit now
      if (active.source === null) return null;
    }

    // if we have cached pre-aggregate info, return that
    if (entries.has(client)) {
      return entries.get(client)!;
    }

    // get non-active materialized view columns
    const preaggCols = preaggColumns(client);

    let info: PreAggregateInfo | typeof Skip | null;
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
      info.result.catch((e: any) => mc.logger().error(e));
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
 * @param clause The active selection clause to analyze.
 */
function activeColumns(clause: SelectionClause): ActiveColumnsResult {
  const { source, meta } = clause;
  const clausePred = clause.predicate;
  const clauseCols = collectColumns(clausePred!).map(c => c.column);
  let predicate: ((p: any) => ExprNode | ExprNode[]) | undefined;
  let columns: Record<string, ExprNode> | undefined;

  if (!meta || !clauseCols) {
    return { source: null, columns, predicate };
  }

  const { type, scales, bin, pixelSize = 1 } = meta as any;

  if (type === 'point') {
    predicate = x => x;
    columns = Object.fromEntries(
      clauseCols.map(col => [`${col}`, asNode(col)])
    );
  } else if (type === 'interval' && scales) {
    // determine pixel-level binning
    const bins = scales.map((s: ScaleOptions) => binInterval(s, pixelSize, bin));

    if (bins.some((b: any) => !b)) {
      // bail if a scale type is unsupported
    } else if (bins.length === 1) {
      // selection clause predicate has type BetweenOpNode
      // single interval selection
      predicate = p => p ? isBetween('active0', p.extent.map(bins[0])) : [];
      columns = { active0: bins[0]((clausePred as any).expr) };
    } else {
      // selection clause predicate has type AndNode<BetweenOpNode>
      // multiple interval selection
      predicate = p => p
        ? and(p.clauses.map(
            (c: any, i: number) => isBetween(`active${i}`, c.extent.map(bins[i]))
          ))
        : [];
      columns = Object.fromEntries(
        (clausePred as any).clauses.map((p: any, i: number) => [`active${i}`, bins[i](p.expr)])
      );
    }
  }

  return { source: columns ? source : null, columns, predicate };
}

const BIN = { ceil, round };

/**
 * Returns a bin function generator to discretize a selection interval domain.
 * @param scale A scale that maps domain values to the output range
 *  (typically pixels).
 * @param pixelSize The interactive pixel size. This value indicates
 *  the bin step size and may be greater than an actual screen pixel.
 * @param bin The binning method to apply, one of `floor`,
 *  `ceil', or `round`.
 * @returns A bin function generator.
 */
function binInterval(scale: ScaleOptions, pixelSize: number, bin: BinMethod): ((value: any) => ExprNode) | undefined {
  const { type, domain, range, apply, sqlApply } = scaleTransform(scale)!;
  if (!apply) return; // unsupported scale type
  const binFn = (BIN as any)[`${bin}`.toLowerCase()] || floor;
  const dom = domain!.map(x => Number(x));
  const lo = apply(Math.min(...dom));
  const hi = apply(Math.max(...dom));
  const s = (type === 'identity'
    ? 1
    : Math.abs(range![1] - range![0]) / (hi - lo)) / pixelSize;
  const scalar = s === 1
    ? (x: ExprValue) => x
    : (x: ExprValue) => mul(float64(s), x);
  const diff = lo === 0
    ? (x: ExprValue) => x
    : (x: ExprValue) => sub(x, float64(lo));
  return value => int32(binFn(scalar(diff(sqlApply(value)))));
}

/**
 * Generate pre-aggregate query information.
 * @param clientQuery The original client query.
 * @param active Active (selected) columns.
 * @param preaggCols Pre-aggregation columns.
 * @param schema Database schema name.
 * @returns Pre-aggregation information.
 */
function preaggregateInfo(clientQuery: SelectQuery, active: ActiveColumnsResult, preaggCols: any, schema: string): PreAggregateInfo {
  const { group, output, preagg } = preaggCols;
  const { columns } = active;

  // build materialized view construction query
  const query = clientQuery
    .setSelect({ ...preagg, ...columns })
    .groupby(Object.keys(columns!));

  // ensure active clause columns are selected by subqueries
  const [subq] = query.subqueries;
  if (subq) {
    const cols = Object.values(columns!)
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
  const select = QueryBuilder
    .select(group, output)
    .from(table)
    .groupby(group)
    .having(having)
    .orderby(order);

  return new PreAggregateInfo({ table, create, active, select });
}

/**
 * Push column selections down to subqueries.
 * @param query The (sub)query to push down to.
 * @param cols The column names to push down.
 */
function subqueryPushdown(query: Query, cols: string[]): void {
  const memo = new Set();
  const pushdown = (q: Query) => {
    // it is possible to have duplicate subqueries
    // so we memoize and exit early if already seen
    if (memo.has(q)) return;
    memo.add(q);

    if (isSelectQuery(q) && q._from.length) {
      // select the pushed down columns
      // note that the select method will deduplicate for us
      q.select(cols);
      if (isAggregateQuery(q)) {
        // if an aggregation query, we need to push to groupby as well
        // we also deduplicate as the column may already be present
        const set = new Set(
          q._groupby.flatMap(x => x instanceof ColumnNameRefNode ? [x.name] : [])
        );
        q.groupby(cols.filter(c => !set.has(c)));
      }
    }
    q.subqueries.forEach(pushdown);
  };
  pushdown(query);
}

/**
 * Test if a query performs aggregation.
 * @param query Select query to test.
 * @returns True if query performs aggregation.
 */
function isAggregateQuery(query: SelectQuery): boolean {
  return query._groupby.length > 0
    || query._select.some(node => isAggregateExpression(node));
}

/**
 * Metadata and query generator for materialized views of pre-aggregated data.
 * This object provides the information needed to generate and query the
 * materialized views for a client-selection pair relative to a specific
 * active clause and selection state.
 */
export class PreAggregateInfo {
  /** The name of the materialized view. */
  table: string;
  /** The SQL query used to generate the materialized view. */
  create: string;
  /** A result promise returned for the materialized view creation query. */
  result: Promise<any> | null;
  /** Definitions and predicate function for the active columns,
   * which are dynamically filtered by the active clause. */
  active: ActiveColumnsResult;
  /** Select query (sans where clause) for materialized views. */
  select: SelectQuery;
  /** Boolean flag indicating a client that should be skipped.
   * This value is always false for a created materialized view. */
  skip: boolean;

  /**
   * Create a new pre-aggregation information instance.
   * @param options Options object.
   */
  constructor({ table, create, active, select }: PreAggregateInfoOptions) {
    this.table = table;
    this.create = create;
    this.result = null;
    this.active = active;
    this.select = select;
    this.skip = false;
  }

  /**
   * Generate a materialized view query for the given predicate.
   * @param predicate The current active clause predicate.
   * @returns A materialized view query.
   */
  query(predicate: ExprNode): SelectQuery {
    return this.select.clone().where(this.active.predicate!(predicate));
  }
}