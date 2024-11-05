const requestIdle = typeof requestIdleCallback !== 'undefined'
  ? requestIdleCallback
  : setTimeout;

export const voidCache = () => ({
  get: () => undefined,
  set: (key, value) => value,
  clear: () => {}
});

export function lruCache({
  max = 1 * 1024 * 1024, // 1 MB cache size as default
  ttl = 3 * 60 * 60 * 1000 // time-to-live, default 3 hours
} = {}) {
  let cache = new Map;
  let curr_size = 0;

  function evict() {
    const expire = performance.now() - ttl;

    while (curr_size > max) {
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
          curr_size -= new Blob([value]).size;
        }
      }
  
      // remove lru entry
      if (cache.has(lruKey) && curr_size > max) {
        curr_size -= new Blob([cache.get(lruKey)]).size;
        cache.delete(lruKey);
      }
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
      let set_value = { last: performance.now(), value };
      cache.set(key, set_value);
      curr_size += new Blob([value]).size;
      
      if (curr_size > max) requestIdle(evict);
      return value;
    },
    clear() { cache = new Map; }
  };
}
