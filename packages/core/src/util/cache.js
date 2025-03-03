import { list, tableFromArrays, tableFromIPC, tableToIPC,  uint8, utf8 } from "@uwdata/flechette";

const requestIdle = typeof requestIdleCallback !== 'undefined'
  ? requestIdleCallback
  : setTimeout;

/**
 * @typedef {import('@uwdata/flechette').Table | Promise<import('@uwdata/flechette').Table>} CacheEntry
 * @typedef {Object} Cache
 * @property {(key: string) => CacheEntry | undefined} get Retrieves a value from the cache.
 * @property {(key: string, value: CacheEntry) => any} set Stores a value in the cache and returns it.
 * @property {() => void} clear Clears all entries in the cache.
 * @property {() => Uint8Array | null} export Exports the cache as an array of bytes in Arrow IPC binary format or null if the cache is empty.
 * @property {(data: ArrayBuffer | Uint8Array | Uint8Array[]) => void} import Imports the cache from an array of bytes in Arrow IPC binary format.
 */

/**
 * Converts a cache instance into a byte buffer.
 * @param {[string, import('@uwdata/flechette').Table][]} kv An array of key-value pairs representing
 * the cache contents.
 * @returns {Uint8Array | null} A byte buffer representing the cache or null if the cache is empty.
 */
const keyValuesToIPC = (kv) => {
  const cache_object = kv.reduce(
    (acc, [key, value]) => {
      const bytes = tableToIPC(value, { format: 'stream' });
      acc.key.push(key);
      acc.value.push(bytes);
      return acc;
    },
    { key: [], value: [] }
  );
  const table = tableFromArrays(cache_object, {
    types: {
      key: utf8(),
      value: list(uint8())
    }
  });
  return tableToIPC(table, { format: 'stream' })
}

/**
 * Converts a byte buffer representing a cache instance into an array of key-value pairs.
 * @param {ArrayBuffer | Uint8Array | Uint8Array[]} bytes The source byte buffer, or an array of buffers representing the cache.
 * @returns {[string, import('@uwdata/flechette').Table][]} An array of key-value pairs representing the cache contents.
 */
const keyValuesFromIPC = (bytes) => {
  const cacheTable = tableFromIPC(bytes);
  return cacheTable.toArray().reduce((acc, row) => {
    return acc.concat([[row.key, tableFromIPC(row.value)]]);
  }, []);
}

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
 * @param {Object} [options] Configuration options for the cache.
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
      const kv = Array.from(cache, ([key, { value }]) => [key, value])
      return keyValuesToIPC(kv);
    },
    import(data) {
      const kv = keyValuesFromIPC(data);
      kv.forEach(([key, value]) => set(key, value));
    }
  };
}
