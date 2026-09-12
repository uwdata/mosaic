import type { Cache } from '../types.js';

/**
 * Create a new cache that ignores all values.
 * @returns A void cache implementation.
 */
export function voidCache(): Cache {
  return {
    get: () => undefined,
    set: (key, value) => value,
    clear: () => {},
    bytes: () => 0
  };
}

/**
 * Create a new cache that evicts least recently used entries once cached bytes
 * exceed a budget.
 * @param options Cache options.
 * @param options.maxBytes Maximum number of bytes to retain.
 * @returns An LRU cache implementation.
 */
export function lruCache({ maxBytes = 256 * 1024 * 1024 }: { maxBytes?: number } = {}): Cache {
  const entries = new Map<string, { value: unknown; bytes: number }>();
  let total = 0;

  function remove(key: string): void {
    const entry = entries.get(key);
    if (entry) {
      entries.delete(key);
      total -= entry.bytes;
    }
  }

  return {
    get(key: string): unknown {
      const entry = entries.get(key);
      if (!entry) return;
      // reinsert so Map iteration order stays least-recently-used first
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },
    set(key: string, value: unknown, bytes: number): unknown {
      remove(key);
      if (bytes > maxBytes) return value;
      entries.set(key, { value, bytes });
      total += bytes;
      if (total <= maxBytes) return value;
      for (const oldest of entries.keys()) {
        remove(oldest);
        if (total <= maxBytes) break;
      }
      return value;
    },
    clear(): void {
      entries.clear();
      total = 0;
    },
    bytes(): number {
      return total;
    }
  };
}
