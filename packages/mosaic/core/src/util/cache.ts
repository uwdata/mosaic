import type { Cache } from '../types.js';

interface CacheEntry {
  last: number;
  value: unknown;
  owner: object;
}

interface OwnerCharge {
  bytes: number;
  refs: number;
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
 * Create a new cache that evicts least recently used entries once cached bytes
 * exceed a budget.
 * @param options Cache options.
 * @param options.maxBytes Maximum number of bytes to retain.
 * @param options.ttl Time-to-live for cache entries.
 * @returns An LRU cache implementation.
 */
export function lruCache({
  maxBytes = 32 * 1024 * 1024,
  ttl = 3 * 60 * 60 * 1000
}: {
  maxBytes?: number;
  ttl?: number;
} = {}): Cache {
  let entries = new Map<string, CacheEntry>();
  let ownerCharges = new Map<object, OwnerCharge>();
  let total = 0;

  function remove(key: string): void {
    const entry = entries.get(key);
    if (!entry) return;
    entries.delete(key);
    const charge = ownerCharges.get(entry.owner)!;
    if (--charge.refs === 0) {
      ownerCharges.delete(entry.owner);
      total -= charge.bytes;
    }
  }

  return {
    get(key: string): unknown {
      const entry = entries.get(key);
      if (!entry) return;

      const now = performance.now();
      if (now - entry.last > ttl) {
        remove(key);
        return;
      }

      entry.last = now;
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },
    set(key: string, value: unknown, bytes = 0, owner: object = {}): unknown {
      remove(key);
      if (bytes > maxBytes) return value;

      entries.set(key, { last: performance.now(), value, owner });
      const charge = ownerCharges.get(owner);
      if (charge) {
        charge.refs += 1;
      } else {
        ownerCharges.set(owner, { bytes, refs: 1 });
        total += bytes;
      }

      for (const oldest of entries.keys()) {
        if (total <= maxBytes) break;
        remove(oldest);
      }

      return value;
    },
    clear(): void {
      entries = new Map();
      ownerCharges = new Map();
      total = 0;
    }
  };
}
