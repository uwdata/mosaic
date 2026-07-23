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
 * Create a new cache that uses an LRU eviction policy, capped by the total
 * observed byte size of its entries rather than by entry count. Eviction is
 * synchronous: on every `set` that pushes the cache past `maxBytes`, the
 * evict pass runs inline (dropping any TTL-expired entries and the single
 * least-recently-used entry) and repeats until the cache fits under budget.
 * There is no deferral to `requestIdleCallback`, so `maxBytes` is enforced
 * as a hard cap rather than a soft target.
 *
 * @param options Cache options.
 * @param options.maxBytes Maximum total observed bytes across all entries.
 * @param options.ttl Time-to-live for cache entries.
 * @returns An LRU cache implementation.
 */
export function lruCache({
  maxBytes = 32 * 1024 * 1024, // 32 MB
  ttl = 3 * 60 * 60 * 1000 // 3 hours
}: {
  maxBytes?: number;
  ttl?: number;
} = {}): Cache {
  let cache = new Map<string, CacheEntry>();
  let totalBytes = 0;

  function evict(): void {
    const expire = performance.now() - ttl;
    let lruKey: string | null = null;
    let lruLast = Infinity;

    for (const [key, entry] of cache) {
      const { last } = entry;

      // least recently used entry seen so far
      if (last < lruLast) {
        lruKey = key;
        lruLast = last;
      }

      // remove if time since last access exceeds ttl
      if (expire > last) {
        totalBytes -= entry.size;
        cache.delete(key);
      }
    }

    // remove lru entry
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
      // Update in place — refund the prior entry's bytes before recounting.
      const prior = cache.get(key);
      if (prior) totalBytes -= prior.size;
      cache.set(key, { last: performance.now(), size, value });
      totalBytes += size;
      // Enforce the budget inline. The loop guard on cache.size prevents an
      // infinite loop if a single entry is larger than maxBytes on its own
      // (evict() would remove it, cache goes empty, we stop).
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
 * Best-effort byte size for a cached value. Exact for strings, ArrayBuffers,
 * and typed arrays; approximated via JSON.stringify for plain objects; 0
 * when nothing sensible can be measured.
 */
function byteSize(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'string') return value.length * 2; // UTF-16 in JS
  if (value instanceof ArrayBuffer) return value.byteLength;
  if (ArrayBuffer.isView(value)) return value.byteLength;
  if (typeof value === 'object') {
    const bl = (value as { byteLength?: unknown }).byteLength;
    if (typeof bl === 'number') return bl;
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 0;
    }
  }
  return 0;
}
