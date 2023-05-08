import { lruCache, voidCache } from './util/cache.js';
import { priorityQueue } from './util/priority-queue.js';

export const Priority = { High: 0, Normal: 1, Low: 2 };

export function QueryManager({
  db,
  clientCache = lruCache(),
  logger
} = {}) {
  const queue = priorityQueue(3);
  let recorders = [];
  let pending = null;

  function next() {
    if (pending || queue.isEmpty()) return;
    const { request, result } = queue.next();
    pending = submit(request, result);
    pending.finally(() => {
      pending = null;
      next();
    });
  }

  async function submit(request, result) {
    const {
      query,
      type,
      cache = false,
      options
    } = request;
    const sql = query ? String(query) : null;

    // record request
    updateRecorders(recorders, sql);

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

    // return query result
    result.fulfill(data);
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
      const result = observer();
      queue.insert({ request, result }, priority);
      next();
      return result;
    },

    cancel(requests) {
      const set = new Set(requests);
      this.queue.remove(({ result }) => set.has(result));
    },

    record() {
      let state = [];
      const recorder = {
        add(query) { state.push(query); },
        reset() { state = []; },
        snapshot() { return state.slice(); },
        stop() {
          recorders = recorders.filter(x => x !== this);
          return state;
        }
      };
      recorders.push(recorder);
      return recorder;
    }
  };
}

function updateRecorders(recorders, sql) {
  if (recorders.length && sql) {
    recorders.forEach(rec => rec.add(sql));
  }
}

function observer() {
  let resolve;
  let reject;
  const p = new Promise((r, e) => { resolve = r; reject = e; });
  p.fulfill = value => resolve(value);
  p.error = err => reject(err);
  return p;
}
