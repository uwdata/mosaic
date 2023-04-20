import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export function cacheKey(sql) {
  return createHash('sha256').update(sql).digest('hex');
}

export class QueryCache {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
    this.cache = new Map;
    readData(cacheDir, this.cache);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, data) {
    this.cache.set(key, data);
    writeData(this.cacheDir, key, data);
    return this;
  }
}

async function readData(dir, cache) {
  await fs.mkdir(dir, { recursive: true });
  const files = await fs.readdir(dir);
  await Promise.allSettled(files.map(async file => {
    const m = file.match(/(.*)\.arrow/);
    const key = m?.[1] || null;
    if (key) {
      const data = await fs.readFile(path.resolve(dir, file));
      cache.set(key, data);
    }
  }));
}

function writeData(dir, key, buffer) {
  const name = `${key}.arrow`;
  fs.writeFile(path.resolve(dir, name), buffer);
}
