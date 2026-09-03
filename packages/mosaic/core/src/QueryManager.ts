import type { Connector } from './connectors/Connector.js';
import type { Cache, Logger, QueryEntry, QueryRequest } from './types.js';
import { consolidator } from './QueryConsolidator.js';
import { lruCache, voidCache } from './util/cache.js';
import { PriorityQueue } from './util/priority-queue.js';
import { QueryResult } from './util/query-result.js';
import { intersects, queryTables, union, type QueryTables, type Tables } from './util/query-tables.js';
import { voidLogger } from './util/void-logger.js';

export const Priority = Object.freeze({ High: 0, Normal: 1, Low: 2 });

interface ScheduledEntry extends QueryEntry {
  tables: QueryTables;
}

export class QueryManager {
  private queue: PriorityQueue<ScheduledEntry>;
  private db: Connector | null;
  private clientCache: Cache | null;
  private _logger: Logger;
  private _logQueries: boolean;
  private _consolidate: ReturnType<typeof consolidator> | null;
  /** Tables written by requests submitted to the connector and not yet settled. */
  private inflight: Map<QueryResult, Tables>;
  private maxConcurrentRequests: number;

  constructor(maxConcurrentRequests: number = 32) {
    this.queue = new PriorityQueue(3);
    this.db = null;
    this.clientCache = null;
    this._logger = voidLogger();
    this._logQueries = false;
    this._consolidate = null;
    this.inflight = new Map();
    this.maxConcurrentRequests = maxConcurrentRequests;
  }

  /** Requests submitted to the connector and not yet settled. */
  get pendingResults(): QueryResult[] {
    return Array.from(this.inflight.keys());
  }

  /**
   * Submit queued requests to the connector, up to the concurrency limit.
   * A request waits while an earlier request writes a table it reads or
   * writes. Raw SQL strings have unknown tables and conflict with everything.
   */
  next(): void {
    let budget = this.maxConcurrentRequests - this.inflight.size;
    if (budget <= 0 || this.queue.isEmpty()) return;

    let writes: Tables = new Set();
    for (const w of this.inflight.values()) writes = union(writes, w);

    const ready: ScheduledEntry[] = [];
    this.queue.remove(entry => {
      const { tables } = entry;
      const blocked = budget <= 0
        || intersects(tables.reads, writes)
        || intersects(tables.writes, writes);
      writes = union(writes, tables.writes);
      if (!blocked) {
        ready.push(entry);
        budget -= 1;
      }
      return !blocked;
    });

    for (const { request, result, tables } of ready) {
      this.inflight.set(result, tables.writes);
      this.submit(request, result).finally(() => {
        this.inflight.delete(result);
        this.next();
      });
    }
  }

  /**
   * Add an entry to the query queue with a priority.
   * @param entry The entry to add.
   * @param priority The query priority, defaults to `Priority.Normal`.
   */
  enqueue(entry: QueryEntry, priority: number = Priority.Normal): void {
    this.queue.insert({ ...entry, tables: queryTables(entry.request) }, priority);
    this.next();
  }

  /**
   * Submit the query to the connector.
   * @param request The request.
   * @param result The query result.
   */
  async submit(request: QueryRequest, result: QueryResult): Promise<void> {
    try {
      const { query, type, cache = false, options } = request;
      const sql = Array.isArray(query) ? query.filter(x => x).join(';\n') : query ? String(query) : null;

      // check query cache
      if (cache) {
        const cached = this.clientCache!.get(sql!);
        if (cached) {
          const data = await cached;
          this._logger.debug('Cache');
          result.fulfill(data);
          return;
        }
      }

      // issue query, potentially cache result
      const t0 = performance.now();
      if (this._logQueries) {
        this._logger.debug('Query', { type, sql, ...options });
      }

      // @ts-expect-error type may be exec | json | arrow
      const promise = this.db!.query({ type, sql: sql!, ...options });
      if (cache) this.clientCache!.set(sql!, promise);

      const data = await promise;

      if (cache) this.clientCache!.set(sql!, data);

      this._logger.debug(`Request: ${(performance.now() - t0).toFixed(1)}`);
      result.fulfill(type === 'exec' ? null : data);
    } catch (err) {
      result.reject(err);
    }
  }

  /**
   * Get or set the current query cache.
   * @param value Cache value to set
   * @returns Current cache
   */
  cache(): Cache | null;
  cache(value: Cache | boolean): Cache;
  cache(value?: Cache | boolean): Cache | null {
    return value !== undefined
      ? (this.clientCache = value === true ? lruCache() : (value || voidCache()))
      : this.clientCache;
  }

  /**
   * Get or set the current logger.
   * @param value Logger to set
   * @returns Current logger
   */
  logger(): Logger;
  logger(value: Logger): Logger;
  logger(value?: Logger): Logger {
    return value ? (this._logger = value) : this._logger;
  }

  /**
   * Get or set if queries should be logged.
   * @param value Whether to log queries
   * @returns Current logging state
   */
  logQueries(): boolean;
  logQueries(value: boolean): boolean;
  logQueries(value?: boolean): boolean {
    return value !== undefined ? this._logQueries = !!value : this._logQueries;
  }

  /**
   * Get or set the database connector.
   * @param connector Connector to set
   * @returns Current connector
   */
  connector(): Connector | null;
  connector(connector: Connector): Connector;
  connector(connector?: Connector): Connector | null {
    return connector ? (this.db = connector) : this.db;
  }

  /**
   * Indicate if query consolidation should be performed.
   * @param flag Whether to enable consolidation
   */
  consolidate(flag: boolean): void {
    if (flag && !this._consolidate) {
      this._consolidate = consolidator(this.enqueue.bind(this), this.clientCache!);
    } else if (!flag && this._consolidate) {
      this._consolidate = null;
    }
  }

  /**
   * Request a query result.
   * @param request The request.
   * @param priority The query priority, defaults to `Priority.Normal`.
   * @returns A query result promise.
   */
  request(request: QueryRequest, priority: number = Priority.Normal): QueryResult {
    const result = new QueryResult();
    const entry = { request, result };
    if (this._consolidate) {
      this._consolidate.add(entry, priority);
    } else {
      this.enqueue(entry, priority);
    }
    return result;
  }

  cancel(requests: QueryResult[]): void {
    const set = new Set(requests);
    if (set.size) {
      this.queue.remove(({ result }) => {
        if (set.has(result)) {
          result.reject('Canceled');
          return true;
        }
        return false;
      });

      for (const result of this.inflight.keys()) {
        if (set.has(result)) {
          result.reject('Canceled');
        }
      }
      this.next();
    }
  }

  clear(): void {
    this.queue.remove(({ result }) => {
      result.reject('Cleared');
      return true;
    });

    for (const result of this.inflight.keys()) {
      result.reject('Cleared');
    }
  }
}
