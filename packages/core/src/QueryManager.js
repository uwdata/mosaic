import { consolidator } from './QueryConsolidator.js';
import { lruCache, voidCache } from './util/cache.js';
import { priorityQueue } from './util/priority-queue.js';
import { QueryResult } from './util/query-result.js';

export const Priority = { High: 0, Normal: 1, Low: 2 };

export class QueryManager {
  constructor() {
    this.queue = priorityQueue(3);
    this.db = null;
    this.clientCache = null;
    this._logger = null;
    this._logQueries = false;
    this.recorders = [];
    this.pending = null;
    this._consolidate = null;
  }

  next() {
    const requests = [];
    const results = [];
    while (!this.queue.isEmpty()) {
      const { request, result } = this.queue.next();
      requests.push(request);
      results.push(result);
    }
    this.pending = this.submitBatch(requests, results);
  }

  enqueue(entry, priority = Priority.Normal) {
    this.queue.insert(entry, priority);
    this.next();
  }

  recordQuery(sql) {
    if (this.recorders.length && sql) {
      this.recorders.forEach(rec => rec.add(sql));
    }
  }

  async submit(request, result) {
    try {
      const { query, type, cache = false, record = true, options } = request;
      const sql = query ? `${query}` : null;

      // update recorders
      if (record) {
        this.recordQuery(sql);
      }

      // check query cache
      if (cache) {
        const cached = this.clientCache.get(sql);
        if (cached) {
          this._logger.debug(`Cache`);
          result.fulfill(cached);
          return;
        }
      }

      // issue query, potentially cache result
      const t0 = performance.now();
      if (this._logQueries) {
        this._logger.debug('Query', { type, sql, ...options });
      }
      const data = await this.db.query({ type, sql, ...options });
      if (cache) this.clientCache.set(sql, data);
      this._logger.debug(`Request: ${(performance.now() - t0).toFixed(1)} ms, ${(t0).toFixed(1)} ms`);
      result.fulfill(data);
    } catch (err) {
      result.reject(err);
    }
  }

  async submitBatch(requests, results) {
    for(let i = 0; i < requests.length; i++){
      try {
        const { query, type, cache = false, record = true, options } = requests[i];
        const sql = query ? `${query}` : null;
        if (record) {
          this.recordQuery(sql);
        }
        if (cache) {
          const cached = this.clientCache.get(sql);
          if (cached) {
            this._logger.debug('Cache');
            results[i].fulfill(cached);
            continue;
          }
        }
        const t0 = performance.now();
        if (this._logQueries) {
          this._logger.debug('Query', { type, sql, ...options });
        }
        this.db.query({ type, sql, ...options }).then(data => {
          if (cache) this.clientCache.set(sql, data);
          this._logger.debug(`Request: ${(performance.now() - t0).toFixed(1)}`);
          results[i].fulfill(data);
        }).catch(err => {
          results[i].reject(err);
        });
      } catch (err) {
        results[i].reject(err);
      }
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
      this._consolidate = consolidator(this.enqueue.bind(this), this.clientCache, this.recordQuery.bind(this));
    } else if (!flag && this._consolidate) {
      this._consolidate = null;
    }
  }

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
      this.queue.remove(({ result }) => set.has(result));
    }
  }

  clear() {
    this.queue.remove(({ result }) => {
      result.reject('Cleared');
      return true;
    });
  }

  record() {
    let state = [];
    const recorder = {
      add(query) {
        state.push(query);
      },
      reset() {
        state = [];
      },
      snapshot() {
        return state.slice();
      },
      stop() {
        this.recorders = this.recorders.filter(x => x !== recorder);
        return state;
      }
    };
    this.recorders.push(recorder);
    return recorder;
  }
}
