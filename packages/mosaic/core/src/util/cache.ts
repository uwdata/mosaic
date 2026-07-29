import type { Cache } from '../types.js';

const requestIdle = typeof requestIdleCallback !== 'undefined'
  ? requestIdleCallback
  : setTimeout;

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
    delete: () => {},
    clear: () => {}
  };
}

/**
 * Create a new cache that uses an LRU eviction policy, capped by the
 * total memory usage. Eviction is deferred to browser idle time via
 * `requestIdleCallback`. Each eviction pass drops any TTL-expired entries and
 * the single least-recently-used entry.
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
      
      // remove expired queries since they likely will not be used again
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
      assertCacheable(value, 'lruCache.set');
      const size = (value as { byteLength?: number } | null)?.byteLength ?? 0;
      const prior = cache.get(key);
      if (prior) totalBytes -= prior.size;

      if (size > maxBytes) {
        if (prior) cache.delete(key);
        return value;
      }

      cache.set(key, { last: performance.now(), size, value });
      totalBytes += size;
      if (totalBytes > maxBytes) requestIdle(evict);
      return value;
    },
    delete(key: string): void {
      const entry = cache.get(key);
      if (entry) {
        totalBytes -= entry.size;
        cache.delete(key);
      }
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

/**
 * Enforce the cache-value contract.
 *
 * A value handed to the cache must be one of the following:
 *   - a Promise (transient — will be replaced by resolved data),
 *   - null/undefined (exec results, tiny by definition),
 *   - a primitive,
 *   - an object annotated with byteLength > 0.
 *
 *
 * @param value The value about to be stored in the cache.
 * @param context Short label identifying the call site included in the error message.
 */
export function assertCacheable(value: unknown, context: string): void {
  if (value != null && typeof (value as { then?: unknown }).then === 'function') {
    return;
  }
  if (value == null) return;

  if (typeof value !== 'object') return;
  const size = (value as { byteLength?: unknown }).byteLength;
  if (typeof size !== 'number' || size <= 0) {
    throw new Error(
      `[${context}] cache contract violation: value must have byteLength > 0 ` +
      `to be cacheable (got byteLength=${String(size)}). ` +
      `Annotate with annotateByteLength before returning.`
    );
  }
}