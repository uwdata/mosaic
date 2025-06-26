import type { Cache } from '../types.js';

const requestIdle = typeof requestIdleCallback !== 'undefined'
  ? requestIdleCallback
  : setTimeout;

interface CacheEntry<T = unknown> {
  last: number;
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
 * Create a new cache that uses an LRU eviction policy.
 * @param options Cache options.
 * @param options.max Maximum number of cache entries.
 * @param options.ttl Time-to-live for cache entries.
 * @returns An LRU cache implementation.
 */
export function lruCache({
  max = 1000, // max entries
  ttl = 3 * 60 * 60 * 1000 // time-to-live, default 3 hours
}: {
  max?: number;
  ttl?: number;
} = {}): Cache {
  let cache = new Map<string, CacheEntry>();

  function evict(): void {
    const expire = performance.now() - ttl;
    let lruKey: string | null = null;
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

  return {
    get(key: string): unknown {
      const entry = cache.get(key);
      if (entry) {
        entry.last = performance.now();
        return entry.value;
      }
    },
    set(key: string, value: unknown): unknown {
      cache.set(key, { last: performance.now(), value });
      if (cache.size > max) requestIdle(evict);
      return value;
    },
    clear(): void {
      cache = new Map();
    }
  };
}