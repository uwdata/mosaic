import type { ExtractionOptions } from '@uwdata/flechette';
import type { Connector } from './connectors/Connector.js';
import type { Cache, Logger, QueryEntry, QueryRequest } from './types.js';
import { consolidator } from './QueryConsolidator.js';
import { abortable } from './util/abort.js';
import { lruCache, voidCache } from './util/cache.js';
import { decodeIPC, tableByteLength } from './util/decode-ipc.js';
import { PriorityQueue } from './util/priority-queue.js';
import { QueryResult, QueryState } from './util/query-result.js';
import { voidLogger } from './util/void-logger.js';

export const Priority = Object.freeze({ High: 0, Normal: 1, Low: 2 });

interface Flight {
  sql: string;
  type: QueryRequest['type'];
  controller: AbortController;
  promise: Promise<unknown>;
}

export class QueryManager {
  private queue: PriorityQueue<QueryEntry>;
  private db: Connector | null;
  private clientCache: Cache;
  private _logger: Logger;
  private _logQueries: boolean;
  private _ipc?: ExtractionOptions;
  private _consolidate: ReturnType<typeof consolidator> | null;
  private _consolidating: boolean;
  private inflight: Map<string, Flight>;
  private flights: Set<Flight>;
  private _timeout: number;
  private _generation: number;
  /** Requests pending with the query manager. */
  public pendingResults: QueryResult[];
  private maxConcurrentRequests: number;
  private pendingExec: boolean;

  constructor(maxConcurrentRequests: number = 32) {
    this.queue = new PriorityQueue(3);
    this.db = null;
    this.clientCache = voidCache();
    this._logger = voidLogger();
    this._logQueries = false;
    this._consolidate = null;
    this._consolidating = false;
    this.inflight = new Map();
    this.flights = new Set();
    this._timeout = 0;
    this._generation = 0;
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
    let sent: Promise<unknown> | undefined;
    try {
      const { query, type, cache = false, options } = request;
      const sql = Array.isArray(query) ? query.filter(x => x).join(';\n') : String(query);
      const generation = this._generation;

      if (cache) {
        const cached = this.clientCache.get(sql) ?? this.inflight.get(sql)?.promise;
        if (cached) {
          const data = await cached;
          this._logger.debug('Cache');
          result.ready(data);
          return;
        }
      }

      const t0 = performance.now();
      if (this._logQueries) {
        this._logger.debug('Query', { type, sql, ...options });
      }

      const controller = new AbortController();
      // @ts-expect-error type may be exec | arrow
      const response = this.db!.query({ ...options, type, sql }, { signal: controller.signal });
      sent = response;
      const promise: Promise<unknown> = type === 'arrow'
        ? response.then(bytes => decodeIPC(bytes, this._ipc))
        : response;
      const flight: Flight = { sql, type, controller, promise: abortable(promise, controller.signal) };
      const ms = this._timeout;
      const timer = ms
        ? setTimeout(() => this.abortFlight(flight, new DOMException(`Query timed out after ${ms} ms`, 'TimeoutError')), ms)
        : undefined;
      this.flights.add(flight);
      if (cache) this.inflight.set(sql, flight);

      const data = await flight.promise.finally(() => {
        clearTimeout(timer);
        this.flights.delete(flight);
        if (this.inflight.get(sql) === flight) this.inflight.delete(sql);
      });

      if (cache && generation === this._generation) {
        this.clientCache.set(sql, data, tableByteLength(data) ?? 0);
      }

      this._logger.debug(`Request: ${(performance.now() - t0).toFixed(1)}`);
      result.ready(type === 'exec' ? null : data);
    } catch (err) {
      result.reject(err);
      // later queries must not overtake an exec that the connector is still running
      if (request.type === 'exec') await sent?.catch(() => {});
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
   * Get or set the query timeout in milliseconds, measured from when a query
   * is sent to the connector. A value of zero disables the timeout.
   * @param value The timeout in milliseconds
   * @returns The current timeout
   */
  timeout(): number;
  timeout(value: number): number;
  timeout(value?: number): number {
    if (value !== undefined) {
      // setTimeout fires immediately for delays above 2^31 - 1 ms
      this._timeout = value > 0 && value <= 2 ** 31 - 1 ? value : 0;
    }
    return this._timeout;
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
    // a disabled consolidator is kept so that clear() can still reject the
    // requests it holds
    if (flag) {
      this._consolidate ??= consolidator(
        this.enqueue.bind(this),
        () => this.clientCache,
        () => this._generation
      );
    }
    this._consolidating = flag;
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
    if (this._consolidate && this._consolidating) {
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
    this._generation += 1;
    this._consolidate?.remove(({ result }) => {
      result.reject('Cleared');
      return true;
    });

    this.queue.remove(({ result }) => {
      result.reject('Cleared');
      return true;
    });

    for (const result of this.pendingResults) {
      result.reject('Cleared');
    }
    this.pendingResults = [];

    for (const flight of this.flights) {
      if (flight.type !== 'exec') this.abortFlight(flight);
    }
  }

  private abortFlight(flight: Flight, reason?: unknown): void {
    if (this.inflight.get(flight.sql) === flight) this.inflight.delete(flight.sql);
    flight.controller.abort(reason);
  }
}
