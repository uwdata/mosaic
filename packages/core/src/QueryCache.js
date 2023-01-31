export class QueryCache {
  constructor({
    max = 1000, // max entries
    ttl = 3 * 60 * 60 * 1000 // time-to-live, default 3 hours
  } = {}) {
    this.max = max;
    this.ttl = ttl;
    this.clear();
  }

  clear() {
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (entry) {
      entry.last = performance.now();
      return entry.promise;
    }
  }

  set(key, promise) {
    const { cache, max } = this;
    const now = performance.now();

    const receive = promise.then(result => {
      console.log(`Query: ${Math.round(performance.now() - now)}`);
      return result;
    });

    cache.set(key, { last: now, promise });
    if (cache.size > max) {
      setTimeout(() => this.evict());
    }

    return receive;
  }

  evict() {
    const expire = performance.now() - this.ttl;
    let lruKey = null;
    let lruLast = Infinity;

    for (const [key, value] of this.cache) {
      const { last } = value;

      // least recently used entry seen so far
      if (last < lruLast) {
        lruKey = key;
        lruLast = last;
      }

      // remove if time since last access exceeds ttl
      if (expire > last) {
        this.cache.delete(key);
      }
    }

    // remove lru entry
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}
