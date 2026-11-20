import type { ExtractionOptions } from '@uwdata/flechette';
import type { Connector } from './connectors/Connector.js';
import type { Cache, Logger, QueryEntry, QueryRequest } from './types.js';
import { consolidator } from './QueryConsolidator.js';
import { abortable } from './util/abort.js';
import { lruCache, voidCache } from './util/cache.js';
import { decodeIPC, tableByteLength } from './util/decode-ipc.js';
import { PriorityQueue } from './util/priority-queue.js';
import { intersects, queryTables, union, type QueryTables, type Tables } from './util/query-tables.js';
import { voidLogger } from './util/void-logger.js';

export const Priority = Object.freeze({ High: 0, Normal: 1, Low: 2 });

interface Flight {
  sql: string;
  type: QueryRequest['type'];
  controller: AbortController;
  promise: Promise<unknown>;
}

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
  private _consolidating: boolean;
  private inflight: Map<string, Flight>;
  private flights: Set<Flight>;
  private _timeout: number;
  private _generation: number;
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
    this._consolidating = false;
    this.inflight = new Map();
    this.flights = new Set();
    this._timeout = 0;
    this._generation = 0;
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
          result.resolve(data);
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
      result.resolve(type === 'exec' ? null : data);
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
  request(request: QueryRequest, priority: number = Priority.Normal): Promise<unknown> {
    const result = Promise.withResolvers();
    const entry = { request, result };
    if (this._consolidate && this._consolidating && request.consolidate !== false) {
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
    this._generation += 1;
    this._consolidate?.remove(({ result }) => {
      result.reject('Cleared');
      return true;
    });

    this.queue.remove(({ result }) => {
      result.reject('Cleared');
      return true;
    });

    for (const { result } of this.running.values()) {
      result.reject('Cleared');
    }

    for (const flight of this.flights) {
      if (flight.type !== 'exec') this.abortFlight(flight);
    }
  }

  private abortFlight(flight: Flight, reason?: unknown): void {
    if (this.inflight.get(flight.sql) === flight) this.inflight.delete(flight.sql);
    flight.controller.abort(reason);
  }
}
