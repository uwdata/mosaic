import type { Connector } from './connectors/Connector.js';
import type { Cache, Logger, QueryEntry, QueryRequest } from './types.js';
import { consolidator } from './QueryConsolidator.js';
import { lruCache, voidCache } from './util/cache.js';
import { PriorityQueue } from './util/priority-queue.js';
import { QueryResult, QueryState } from './util/query-result.js';
import { voidLogger } from './util/void-logger.js';

export const Priority = Object.freeze({ High: 0, Normal: 1, Low: 2 });

export class QueryManager {
  private queue: PriorityQueue<QueryEntry>;
  private db: Connector | null;
  private clientCache: Cache | null;
  private _logger: Logger;
  private _logQueries: boolean;
  private _consolidate: ReturnType<typeof consolidator> | null;
  /** Requests pending with the query manager. */
  public pendingResults: QueryResult[];
  private maxConcurrentRequests: number;
  private pendingExec: boolean;

  constructor(maxConcurrentRequests: number = 32) {
    this.queue = new PriorityQueue(3);
    this.db = null;
    this.clientCache = null;
    this._logger = voidLogger();
    this._logQueries = false;
    this._consolidate = null;
    this.pendingResults = [];
    this.maxConcurrentRequests = maxConcurrentRequests;
    this.pendingExec = false;
  }

  next(): void {
    if (this.queue.isEmpty() || this.pendingResults.length > this.maxConcurrentRequests || this.pendingExec) {
      return;
    }

    const entry = this.queue.next();
    if (!entry) return;

    const { request, result } = entry;

    this.pendingResults.push(result);
    if (request.type === 'exec') this.pendingExec = true;

    this.submit(request, result).finally(() => {
      // return from the queue all requests that are ready
      while (this.pendingResults.length && this.pendingResults[0].state !== QueryState.pending) {
        const result = this.pendingResults.shift()!;
        if (result.state === QueryState.ready) {
          result.fulfill();
        } else if (result.state === QueryState.done) {
          this._logger.warn('Found resolved query in pending results.');
        }
      }
      if (request.type === 'exec') this.pendingExec = false;
      this.next();
    });
  }

  /**
   * Add an entry to the query queue with a priority.
   * @param entry The entry to add.
   * @param priority The query priority, defaults to `Priority.Normal`.
   */
  enqueue(entry: QueryEntry, priority: number = Priority.Normal): void {
    this.queue.insert(entry, priority);
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
      const sql = query ? `${query}` : null;

      // check query cache
      if (cache) {
        const cached = this.clientCache!.get(sql!);
        if (cached) {
          const data = await cached;
          this._logger.debug('Cache');
          result.ready(data);
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
      result.ready(type === 'exec' ? null : data);
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

      for (const result of this.pendingResults) {
        if (set.has(result)) {
          result.reject('Canceled');
        }
      }
    }
  }

  clear(): void {
    this.queue.remove(({ result }) => {
      result.reject('Cleared');
      return true;
    });

    for (const result of this.pendingResults) {
      result.reject('Cleared');
    }
    this.pendingResults = [];
  }
}