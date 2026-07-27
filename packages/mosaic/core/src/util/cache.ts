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
      
      //Removing expired queries since they likely will not be used again.
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
      const size = (value as { byteLength?: number } | null)?.byteLength ?? 0;
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
 * Attach a non-enumerable `byteLength` property to a cached value so that
 * caches can estimate size.
 * Called by the connectors on JSON payloads and by `decodeIPC` on Arrow
 * Tables.
 *
 * The property is non-enumerable so it does not appear in iteration,
 * spread, or JSON serialization of the value.
 *
 * @param value The value to annotate. Must be a non-null object.
 * @param bytes The byte size to record. Ignored if not positive.
 * @returns The annotated value.
 */
export function annotateByteLength<T extends object>(value: T, bytes: number): T {
  if (bytes > 0) {
    Object.defineProperty(value, 'byteLength', {
      value: bytes,
      enumerable: false,
      writable: false,
      configurable: true
    });
  }
  return value;
}