import { consolidator } from './QueryConsolidator.js';
import { lruCache, voidCache } from './util/cache.js';
import { PriorityQueue } from './util/priority-queue.js';
import { QueryResult, QueryState } from './util/query-result.js';
import { voidLogger } from './util/void-logger.js';

export const Priority = Object.freeze({ High: 0, Normal: 1, Low: 2 });

export class QueryManager {
  constructor(
    maxConcurrentRequests = 32
  ) {
    /** @type {PriorityQueue} */
    this.queue = new PriorityQueue(3);
    this.db = null;
    this.clientCache = null;
    this._logger = voidLogger();
    this._logQueries = false;
    this._consolidate = null;
    /**
     * Requests pending with the query manager.
     * @type {QueryResult[]}
     */
    this.pendingResults = [];
    /** @type {number} */
    this.maxConcurrentRequests = maxConcurrentRequests;
    /** @type {boolean} */
    this.pendingExec = false;
  }

  next() {
    if (this.queue.isEmpty() || this.pendingResults.length > this.maxConcurrentRequests || this.pendingExec) {
      return;
    }

    const { request, result } = this.queue.next();

    this.pendingResults.push(result);
    if (request.type === 'exec') this.pendingExec = true;

    this.submit(request, result).finally(() => {
      // return from the queue all requests that are ready
      while (this.pendingResults.length && this.pendingResults[0].state !== QueryState.pending) {
        const result = this.pendingResults.shift();
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
   * @param {object} entry The entry to add.
   * @param {*} [entry.request] The query request.
   * @param {QueryResult} [entry.result] The query result.
   * @param {number} priority The query priority, defaults to `Priority.Normal`.
   */
  enqueue(entry, priority = Priority.Normal) {
    this.queue.insert(entry, priority);
    this.next();
  }

  /**
   * Submit the query to the connector.
   * @param {*} request The request.
   * @param {QueryResult} result The query result.
   */
  async submit(request, result) {
    try {
      const { query, type, cache = false, options } = request;
      const sql = query ? `${query}` : null;

      // check query cache
      if (cache) {
        const cached = this.clientCache.get(sql);
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

      const promise = this.db.query({ type, sql, ...options });
      if (cache) this.clientCache.set(sql, promise);

      const data = await promise;

      if (cache) this.clientCache.set(sql, data);

      this._logger.debug(`Request: ${(performance.now() - t0).toFixed(1)}`);
      result.ready(type === 'exec' ? null : data);
    } catch (err) {
      result.reject(err);
    }
  }

  cache(value) {
    return value !== undefined
      ? (this.clientCache = value === true ? lruCache() : (value || voidCache()))
      : this.clientCache;
  }

  logger(value) {
    return value ? (this._logger = value) : this._logger;
  }

  logQueries(value) {
    return value !== undefined ? this._logQueries = !!value : this._logQueries;
  }

  connector(connector) {
    return connector ? (this.db = connector) : this.db;
  }

  consolidate(flag) {
    if (flag && !this._consolidate) {
      this._consolidate = consolidator(this.enqueue.bind(this), this.clientCache);
    } else if (!flag && this._consolidate) {
      this._consolidate = null;
    }
  }

  /**
   * Request a query result.
   * @param {*} request The request.
   * @param {number} priority The query priority, defaults to `Priority.Normal`.
   * @returns {QueryResult} A query result promise.
   */
  request(request, priority = Priority.Normal) {
    const result = new QueryResult();
    const entry = { request, result };
    if (this._consolidate) {
      this._consolidate.add(entry, priority);
    } else {
      this.enqueue(entry, priority);
    }
    return result;
  }

  cancel(requests) {
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

  clear() {
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
