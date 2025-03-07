import { tableFromIPC, tableToIPC } from "@uwdata/flechette";

const requestIdle = typeof requestIdleCallback !== 'undefined'
  ? requestIdleCallback
  : setTimeout;

/**
 * @typedef {import('@uwdata/flechette').Table | Promise<import('@uwdata/flechette').Table>} CacheEntry
 * @typedef {object} Cache
 * @property {(key: string) => CacheEntry | undefined} get Retrieves a value from the cache.
 * @property {(key: string, value: CacheEntry) => any} set Stores a value in the cache and returns it.
 * @property {() => void} clear Clears all entries in the cache.
 * @property {() => Map<string, Uint8Array> | null} export Exports the cache as a Map where keys are strings and
 *  values are Arrow IPC binary format (Uint8Array), or null if the cache is empty.
 * @property {(data: Map<string, Uint8Array>) => void} import Imports the cache from a Map where keys are strings
 *  and values are Arrow IPC binary format (Uint8Array).
 */

/**
 * Creates a cache that does nothing (a no-op cache).
 * @returns {Cache} A void cache that doesn't store or retrieve values.
 */
export const voidCache = () => ({
  get: () => undefined,
  set: (key, value) => value,
  clear: () => {},
  export: () => null,
  import: () => {}
});

/**
 * Creates a Least Recently Used (LRU) cache with a fixed size and time-to-live (TTL).
 * @param {object} [options] Configuration options for the cache.
 * @param {number} [options.max=1000] Maximum number of entries before eviction.
 * @param {number} [options.ttl=10800000] Time-to-live for each entry in milliseconds (default: 3 hours).
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
      return Array.from(cache).reduce(
        (acc, [key, entry]) => {
          acc.set(key, tableToIPC(entry.value, { format: 'stream' }));
          return acc;
        },
        new Map()
      );
    },
    import(data) {
      Array.from(data).forEach(
        ([key, value]) => set(key, tableFromIPC(value))
      );
    }
  };
}
