import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_CACHE_DIR = '.cache';
const DEFAULT_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

export function cacheKey(hashable, type) {
  return createHash('sha256').update(hashable).digest('hex') + '.' + type;
}

class CacheEntry {
  constructor(data, ttl = DEFAULT_TTL) {
    this.data = data;
    this.touch(ttl);
  }
  touch(ttl = DEFAULT_TTL) {
    this.last = Math.round(Math.max(this.last, performance.now() + ttl));
    return this;
  }
}

export class Cache {
  constructor({
    max = 10 * 1024 * 1024, // 10 MB cache size as default
    dir = DEFAULT_CACHE_DIR,
    ttl = DEFAULT_TTL
  }) {
    this.cache = new Map;
    this.max = max;
    this.dir = dir;
    this.ttl = ttl;
    this.curr_size = 0;
    readEntries(dir, this.cache);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      fs.rm(path.resolve(this.dir, key), { force: true });
    }
    return deleted;
  }

  get(key) {
    return this.cache.get(key)?.touch(this.ttl).data;
  }

  set(key, data, { persist = false, ttl = this.ttl } = {}) {
    const entry = new CacheEntry(data, persist ? Infinity : ttl);
    this.cache.set(key, entry);
    this.curr_size += new Blob([entry]).size;
    if (persist) writeEntry(this.dir, key, entry);
    if (this.shouldEvict()) setTimeout(() => this.evict());
    return this;
  }

  shouldEvict() {
    return this.curr_size > this.max;
  }

  evict() {
    const expire = performance.now();

    while (this.shouldEvict()) {
      let lruKey = null;
      let lruLast = Infinity;

      for (const [key, entry] of this.cache) {
        const { last } = entry;
        if (last === Infinity) continue;

        // least recently used entry seen so far
        if (last < lruLast) {
          lruKey = key;
          lruLast = last;
        }

        // remove if time since last access exceeds ttl
        if (expire > last) {
          this.cache.delete(key);
          this.curr_size -= new Blob([entry]).size;
        }
      }

      // remove lru entry
      if (this.shouldEvict() && this.cache.has(lruKey)) {
        this.curr_size -= new Blob([this.cache.get(lruKey)]).size;
        this.cache.delete(lruKey);
      }
    }
  }
}

async function readEntries(dir, cache) {
  let files;
  try {
    files = await fs.readdir(dir);
  } catch (err) { // eslint-disable-line no-unused-vars
    return; // dir does not exist, nothing to do
  }
  await Promise.allSettled(files.map(async file => {
    const m = file.match(/.*\.(arrow|json)/);
    const key = m?.[1] || null;
    if (key) {
      const data = await fs.readFile(path.resolve(dir, file));
      cache.set(key, new CacheEntry(data, Infinity));
    }
  }));
}

function writeEntry(dir, key, entry) {
  return fs.mkdir(dir, { recursive: true }).then(
    () => fs.writeFile(path.resolve(dir, key), entry.data)
  );
}
