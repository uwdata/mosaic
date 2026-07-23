import type { Cache } from '../types.js';

interface CacheEntry<T = unknown> {
  last: number;
  size: number;
  value: T;
}

/**
 * Create a new cache that ignores all values.
 * @returns A void cache implementation.
 */
export function voidCache(): Cache {
  return {
    get: () => undefined,
    set: (key, value) => value,
    clear: () => {}
  };
}

/**
 * Create a new cache that uses an LRU eviction policy, capped by the
 * total memory usage. Eviction is synchronous: on every `set` that 
 * pushes the cache past `maxBytes`, the
 * evict pass runs immediately (dropping any TTL-expired entries and the single
 * LRU query) until the cache fits according to the memory requirement.
 *
 * @param options Cache options.
 * @param options.maxBytes Maximum total observed bytes across all entries.
 * @param options.ttl Time-to-live for cache entries.
 * @returns An LRU cache implementation.
 */
export function lruCache({
  maxBytes = 32 * 1024 * 1024, // 32 MB of allocated default memory
  ttl = 3 * 60 * 60 * 1000 // 3 hours
}: {
  maxBytes?: number;
  ttl?: number;
} = {}): Cache {
  let cache = new Map<string, CacheEntry>();
  let totalBytes = 0;
  /**
   * Looks through our LRU cache and removes any expired queries and the current LRU query.
   * Opts for a "naive" O(n) lookthrough to get and eliminate expired queries and the LRU.
   * While this is computationally expensive, it makes the code less complex.
   */
  function evict(): void {
    const expire = performance.now() - ttl;
    let lruKey: string | null = null;
    let lruLast = Infinity;

    for (const [key, entry] of cache) {
      const { last } = entry;

      if (last < lruLast) {
        lruKey = key;
        lruLast = last;
      }

      if (expire > last) {
        totalBytes -= entry.size;
        cache.delete(key);
      }
    }

    if (lruKey) {
      const lru = cache.get(lruKey);
      if (lru) totalBytes -= lru.size;
      cache.delete(lruKey);
    }
  }

  return {
    get(key: string): unknown {
      const entry = cache.get(key);
      if (entry) {
        entry.last = performance.now();
        return entry.value;
      }
    },
    set(key: string, value: unknown): unknown {
      const size = byteSize(value);
      const prior = cache.get(key);
      if (prior) totalBytes -= prior.size;
      cache.set(key, { last: performance.now(), size, value });
      totalBytes += size;
      // The loop guard on cache.size prevents an
      // infinite loop if a single entry is larger than maxBytes on its own.
      while (totalBytes > maxBytes && cache.size > 0) evict();
      return value;
    },
    clear(): void {
      cache = new Map();
      totalBytes = 0;
    }
  };
}

/**
 * Byte size for a cached value. Mosaic connectors produce a bytesize to use reliably. Unannotated shapes return 0, treating them as
 * free. This should not be of concern since every query that is stored in the cache goes through the respective connectors that have an 
 * annotated bytesize.
 */
function byteSize(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'string') return value.length * 2; // UTF-16 in JS
  if (value instanceof ArrayBuffer) return value.byteLength;
  if (ArrayBuffer.isView(value)) return value.byteLength;
  if (typeof value === 'object') {
    const bl = (value as { byteLength?: unknown }).byteLength;
    if (typeof bl === 'number') return bl;
  }
  return 0;
}
