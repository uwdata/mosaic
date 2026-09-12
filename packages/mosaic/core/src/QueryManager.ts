import type { ExtractionOptions } from '@uwdata/flechette';
import type { Connector } from './connectors/Connector.js';
import type { Cache, Logger, QueryEntry, QueryRequest } from './types.js';
import { consolidator } from './QueryConsolidator.js';
import { lruCache, voidCache } from './util/cache.js';
import { decodeIPC, tableByteLength } from './util/decode-ipc.js';
import { PriorityQueue } from './util/priority-queue.js';
import { intersects, queryTables, union, type QueryTables, type Tables } from './util/query-tables.js';
import { voidLogger } from './util/void-logger.js';

export const Priority = Object.freeze({ High: 0, Normal: 1, Low: 2 });

interface ScheduledEntry extends QueryEntry {
  tables: QueryTables;
}

export class QueryManager {
  private queue: PriorityQueue<ScheduledEntry>;
  private db: Connector | null;
  private clientCache: Cache;
  private _logger: Logger;
  private _logQueries: boolean;
  private _ipc?: ExtractionOptions;
  private _consolidate: ReturnType<typeof consolidator> | null;
  private running: Map<Promise<unknown>, ScheduledEntry>;
  private inflight: Map<string, Promise<unknown>>;
  private maxConcurrentRequests: number;

  /**
   * @param maxConcurrentRequests How many requests may be in flight at once.
   */
  constructor(maxConcurrentRequests: number = 32) {
    this.queue = new PriorityQueue(3);
    this.db = null;
    this.clientCache = voidCache();
    this._logger = voidLogger();
    this._logQueries = false;
    this._consolidate = null;
    this.running = new Map();
    this.inflight = new Map();
    this.maxConcurrentRequests = maxConcurrentRequests;
  }

  /**
   * Submit queued requests to the connector, up to the concurrency limit.
   * A request waits while an earlier request writes a table it reads or writes.
   */
  next(): void {
    let budget = this.maxConcurrentRequests - this.running.size;
    if (budget <= 0 || this.queue.isEmpty()) return;

    let writes: Tables = new Set();
    for (const { tables } of this.running.values()) {
      writes = union(writes, tables.writes);
    }

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

    for (const entry of ready) {
      this.running.set(entry.result.promise, entry);
      this.submit(entry.request, entry.result).finally(() => {
        this.running.delete(entry.result.promise);
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
  async submit(request: QueryRequest, result: PromiseWithResolvers<unknown>): Promise<void> {
    try {
      const { query, type, cache = false, options } = request;
      const sql = Array.isArray(query) ? query.filter(x => x).join(';\n') : String(query);

      if (cache) {
        const cached = this.clientCache.get(sql) ?? this.inflight.get(sql);
        if (cached) {
          const data = await cached;
          this._logger.debug('Cache');
          result.resolve(data);
          return;
        }
      }

      const t0 = performance.now();
      if (this._logQueries) {
        this._logger.debug('Query', { type, sql, ...options });
      }

      // @ts-expect-error type may be exec | arrow
      const response = this.db!.query({ ...options, type, sql });
      const promise = type === 'arrow'
        ? response.then(bytes => decodeIPC(bytes, this._ipc))
        : response;
      if (cache) this.inflight.set(sql, promise);

      const data = await promise.finally(() => { if (cache) this.inflight.delete(sql); });

      if (cache) this.clientCache.set(sql, data, tableByteLength(data) ?? 0);

      this._logger.debug(`Request: ${(performance.now() - t0).toFixed(1)}`);
      result.resolve(type === 'exec' ? null : data);
    } catch (err) {
      result.reject(err);
    }
  }

  /**
   * Get or set the current query cache.
   * @param value Cache value to set
   * @returns Current cache
   */
  cache(value?: Cache | boolean): Cache {
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
   * Get or set the Arrow IPC extraction options.
   * @param value Extraction options to set
   * @returns Current extraction options
   */
  ipc(value?: ExtractionOptions): ExtractionOptions | undefined {
    if (value === undefined) return this._ipc;
    this.clientCache.clear();
    return this._ipc = value;
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
      this._consolidate = consolidator(this.enqueue.bind(this), this.clientCache);
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
  request(request: QueryRequest, priority: number = Priority.Normal): Promise<unknown> {
    const result = Promise.withResolvers();
    const entry = { request, result };
    if (this._consolidate) {
      this._consolidate.add(entry, priority);
    } else {
      this.enqueue(entry, priority);
    }
    return result.promise;
  }

  cancel(requests: Promise<unknown>[]): void {
    const set = new Set(requests);
    if (set.size) {
      this.queue.remove(({ result }) => {
        if (set.has(result.promise)) {
          result.reject('Canceled');
          return true;
        }
        return false;
      });

      for (const [promise, { result }] of this.running) {
        if (set.has(promise)) {
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

    for (const { result } of this.running.values()) {
      result.reject('Cleared');
    }
  }
}
