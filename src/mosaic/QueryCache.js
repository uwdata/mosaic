export class QueryCache {
  constructor() {
    this.clear();
  }

  clear() {
    this.cache = new Map();
    this.stats = { cells: 0, hits: 0, misses: 0 };
  }

  set(key, promise) {
    const t0 = performance.now();
    const entry = {
      latency: Infinity,
      last: t0,
      hits: 0,
      promise
    };

    const receive = promise.then(result => {
      const latency = performance.now() - t0;
      entry.latency = latency;
      this.stats.cells += (entry.cells = result.numRows * result.numCols || 0);
      console.log(`Query: ${Math.round(latency)}`);
      return result;
    });
    receive.catch(() => entry.latency = NaN);

    this.cache.set(key, entry);
    return receive;
  }

  get(key) {
    const { cache, stats } = this;
    const entry = cache.get(key);
    if (entry) {
      entry.last = performance.now();
      entry.hits += 1;
      stats.hits += 1;
      return entry.promise;
    } else {
      stats.misses += 1;
    }
  }
}
