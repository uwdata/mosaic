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
  ttl = 3 * 60 * 60 * 1000, // time-to-live, default 3 hours
  lruWeight = 0.2 // Weight for recency vs cost-benefit (higher = more LRU-like)
} = {}) {
  let cache = new Map;
  let currSize = 0;

  function evict() {
    console.log("evicting!!")
    const expire = performance.now() - ttl;

    while (currSize > max) {
      let evictKey = null;
      let evictSize = null;
      let bestScore = Infinity;
      
      // First pass: calculate min/max values for normalization
      let minCost = Infinity, maxCost = -Infinity;
      let minTime = Infinity, maxTime = -Infinity;
      for (const [key, entry] of cache) {
        const latency = entry.latency || 1; // Default to 1 if latency is 0
        const size = entry.size || 1; // Default to 1 if size is 0
        const costScore = latency / size;
        const timestamp = entry.last

        // remove entry if time since last access exceeds ttl
        if (expire > entry.last) {
          cache.delete(key);
          currSize -= size;
          continue;
        }
        
        minCost = Math.min(minCost, costScore);
        maxCost = Math.max(maxCost, costScore);
        minTime = Math.min(minTime, timestamp);
        maxTime = Math.max(maxTime, timestamp);
      }

      // Avoid division by zero with fallbacks
      const costRange = (maxCost - minCost) || 1;
      const timeRange = (maxTime - minTime) || 1;
      
      // Second pass: calculate normalized scores and find best eviction candidate
      for (const [key, entry] of cache) {
        const latency = entry.latency;
        const size = entry.size;
        const timestamp = entry.last;
        
        const rawCostScore = latency / size;
        
        // Normalize both factors to 0-1 range
        // For cost: higher cost = lower normalized score (we want to keep high value items)
        // For time: higher timestamp = higher normalized score (we want to keep recent items)
        const normCost = (rawCostScore - minCost) / costRange;
        const normTime = (timestamp - minTime) / timeRange;
        
        // Combine scores: low combined score = evict first
        const combinedScore = 
            (1 - lruWeight) * normCost + lruWeight * normTime;
        
        if (combinedScore < bestScore) {
            bestScore = combinedScore;
            evictKey = key;
            evictSize = entry.size
        }
      }

      // Remove best eviction candidate
      if (evictKey !== null && cache.has(evictKey)) {
        currSize -= evictSize;
        cache.delete(evictKey);
        console.log("evicted: ", evictKey)
      } else {
        // Safety break in case we can't find anything to evict
        break;
      }
    }
  }

  return {
    get(key) {
      const entry = cache.get(key);
      console.log("Size", currSize, cache.size)
      if (entry) {
        entry.last = performance.now();
        console.log("get: cache hit ", key)
        return entry.value;
      }
    },
    set(key, value, latency=0) {
      console.log("set: ", key)
      let setValue = { 
        last: performance.now(), 
        size: new Blob([value]).size,
        latency: latency,
        value 
      };
      
      if (cache.has(key)) {
        currSize -= cache.get(key).size;
        console.log("set: cache hit ", currSize)
      }
      cache.set(key, setValue);
      currSize += setValue.size;
      console.log("set: new cache size ", currSize)
      
      if (currSize > max) requestIdle(evict);
      return value;
    },
    clear() { cache = new Map; }
  };
}
