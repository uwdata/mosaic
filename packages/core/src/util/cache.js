const requestIdle = typeof requestIdleCallback !== 'undefined'
  ? requestIdleCallback
  : setTimeout;

export const voidCache = () => ({
  get: () => undefined,
  set: (key, value) => value,
  clear: () => {}
});

export function lruCache({
  max = 1000, // max entries
  ttl = 3 * 60 * 60 * 1000 // time-to-live, default 3 hours
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

  return {
    get(key) {
      const entry = cache.get(key);
      if (entry) {
        entry.last = performance.now();
        return entry.value;
      }
    },
    set(key, value) {
      cache.set(key, { last: performance.now(), value });
      if (cache.size > max) requestIdle(evict);
      return value;
    },
    clear() { cache = new Map; }
  };
}
