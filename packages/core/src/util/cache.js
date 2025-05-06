/** @import { Cache } from '../types.js' */
import { tableToIPC } from "@uwdata/flechette";
import { decodeIPC } from "./decode-ipc.js";

const requestIdle = typeof requestIdleCallback !== 'undefined'
  ? requestIdleCallback
  : setTimeout;

/**
 * Create a new cache that ignores all values.
 * @returns {Cache} A void cache that doesn't store or retrieve values.
 */
export function voidCache() {
  return {
    get: () => undefined,
    set: (key, value) => value,
    clear: () => {},
    export: () => null,
    import: () => {}
  };
}

/**
 * Create a new cache that uses an LRU eviction policy.
 * @param {object} [options] Cache options.
 * @param {number} [options.max=1000] Maximum number of cache entries.
 * @param {number} [options.ttl=10800000] Time-to-live for cache entries in ms (default: 3 hours).
 * @returns {Cache} An LRU cache instance.
 */
export function lruCache({
  max = 1000,
  ttl = 3 * 60 * 60 * 1000
} = {}) {
  let cache = new Map;

  function evict() {
    const expire = performance.now() - ttl;
    let lruKey = null;
    let lruLast = Infinity;

    for (const [key, value] of cache) {
      const { last } = value;

      // least recently used entry seen so far
      if (last < lruLast) {
        lruKey = key;
        lruLast = last;
      }

      // remove if time since last access exceeds ttl
      if (expire > last) {
        cache.delete(key);
      }
    }

    // remove lru entry
    if (lruKey) {
      cache.delete(lruKey);
    }
  }

  function get(key) {
    const entry = cache.get(key);
    if (entry) {
      entry.last = performance.now();
      return entry.value;
    }
  }

  function set(key, value) {
    cache.set(key, { last: performance.now(), value });
    if (cache.size > max) requestIdle(evict);
    return value;
  }

  return {
    get,
    set,
    clear() { cache = new Map; },
    export() {
      return new Map(Array.from(cache).map(([key, entry]) => [key, tableToIPC(entry.value, {})]));
    },
    import(data) {
      for (const [key, entry] of data) {
        set(key, decodeIPC(entry));
      }
    }
  };
}
