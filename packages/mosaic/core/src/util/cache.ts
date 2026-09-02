import type { Cache } from '../types.js';

interface CacheEntry {
  last: number;
  value: unknown;
  owner?: object;
}

interface OwnerCharge {
  bytes: number;
  refs: number;
}

export function jsonByteLength(value: unknown): number {
  if (value == null) return 0;
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
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

  function charge(owner: object, bytes: number): void {
    const record = ownerCharges.get(owner);
    if (record) {
      record.refs += 1;
    } else {
      ownerCharges.set(owner, { bytes, refs: 1 });
      total += bytes;
    }
  }

  function release(owner?: object): void {
    if (!owner) return;
    const record = ownerCharges.get(owner)!;
    if (--record.refs === 0) {
      ownerCharges.delete(owner);
      total -= record.bytes;
    }
  }

  function remove(key: string): void {
    const entry = entries.get(key);
    if (entry) {
      entries.delete(key);
      release(entry.owner);
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
    set(key: string, value: unknown, bytes = 0, owner?: object): unknown {
      remove(key);
      if (bytes > maxBytes) return value;

      const entry: CacheEntry = { last: performance.now(), value };
      if (bytes > 0) {
        entry.owner = owner
          ?? (typeof value === 'object' && value !== null ? value : entry);
        charge(entry.owner, bytes);
      }
      entries.set(key, entry);

      while (total > maxBytes) {
        const oldest = entries.keys().next();
        if (oldest.done) break;
        remove(oldest.value);
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
