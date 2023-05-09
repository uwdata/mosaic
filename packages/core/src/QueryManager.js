import { lruCache, voidCache } from './util/cache.js';
import { priorityQueue } from './util/priority-queue.js';

export const Priority = { High: 0, Normal: 1, Low: 2 };

export function QueryManager() {
  const queue = priorityQueue(3);
  let db;
  let clientCache;
  let logger;
  let recorders = [];
  let pending = null;

  function next() {
    if (pending || queue.isEmpty()) return;
    const { request, result } = queue.next();
    pending = submit(request, result);
    pending.finally(() => { pending = null; next(); });
  }

  async function submit(request, result) {
    try {
      const { query, type, cache = false, options } = request;
      const sql = query ? String(query) : null;

      // update recorders
      if (recorders.length && sql) {
        recorders.forEach(rec => rec.add(sql));
      }

      // check query cache
      if (cache) {
        const cached = clientCache.get(sql);
        if (cached) {
          logger.debug('Cache');
          result.fulfill(cached);
          return;
        }
      }

      // issue query, potentially cache result
      const t0 = performance.now();
      const data = await db.query({ type, sql, ...options });
      if (cache) clientCache.set(sql, data);
      logger.debug(`Request: ${(performance.now() - t0).toFixed(1)}`);
      result.fulfill(data);
    } catch (err) {
      result.reject(err);
    }
  }

  return {
    cache(value) {
      return value !== undefined
        ? (clientCache = value === true ? lruCache() : (value || voidCache()))
        : clientCache;
    },

    logger(value) {
      return value ? (logger = value) : logger;
    },

    connector(connector) {
      return connector ? (db = connector) : db;
    },

    request(request, priority = Priority.Normal) {
      const result = queryResult();
      queue.insert({ request, result }, priority);
      next();
      return result;
    },

    cancel(requests) {
      const set = new Set(requests);
      queue.remove(({ result }) => set.has(result));
    },

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
          recorders = recorders.filter(x => x !== recorder);
          return state;
        }
      };
      recorders.push(recorder);
      return recorder;
    }
  };
}

function queryResult() {
  let resolve;
  let reject;
  const p = new Promise((r, e) => { resolve = r; reject = e; });
  p.fulfill = value => (resolve(value), p);
  p.reject = err => (reject(err), p);
  return p;
}
