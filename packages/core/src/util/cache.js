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
  let currSize = 0;

  function evict() {
    const expire = performance.now() - ttl;

    while (currSize > max) {
      let lruKey = null;
      let lruLast = Infinity;
      let lruSize = null;

      for (const [key, value] of cache) {
        const { last, size } = value;
  
        // least recently used entry seen so far
        if (last < lruLast) {
          lruKey = key;
          lruLast = last;
          lruSize = size;
        }
  
        // remove if time since last access exceeds ttl
        if (expire > last) {
          cache.delete(key);
          currSize -= lruSize;
        }
      }
  
      // remove lru entry
      if (cache.has(lruKey)) {
        currSize -= cache.get(lruKey).size;
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
      let setValue = { 
        last: performance.now(), 
        size: new Blob([value]).size,
        value 
      };
      cache.set(key, setValue);
      currSize += setValue.size;
      
      if (currSize > max) requestIdle(evict);
      return value;
    },
    clear() { cache = new Map; }
  };
}
