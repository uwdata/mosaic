import fs from 'node:fs/promises';
import path from 'node:path';
import { cacheKey } from '../Cache.js';

async function retrieve(db, cache, sql, type) {
  const key = cacheKey(sql, type);
  const cached = cache.get(key);
  if (cached) return cached;
  switch (type) {
    case 'arrow':
      return db.arrowBuffer(sql);
    case 'json':
      return JSON.stringify(await db.query(sql));
    default:
      throw new Error(`Unsupported query type: ${type}`);
  }
}

export async function createBundle(db, cache, queries, dir) {
  const describe_re = /^DESCRIBE /;
  const pragma_re = /^PRAGMA /;
  const view_re = /^CREATE( TEMP| TEMPORARY)? VIEW/;
  const table_re = /^CREATE( TEMP| TEMPORARY)? TABLE( IF NOT EXISTS)? ([^\s]+)/;

  const manifest = { tables: [], queries: [] };

  await fs.mkdir(dir, { recursive: true });

  const querySet = new Set(queries);
  for (const query of querySet) {
    const sql = typeof query === 'string' ? query : query.sql;
    if (query.alias) {
      const table = query.alias;
      const file = path.resolve(dir, `${table}.parquet`);
      await db.exec(`COPY (${sql}) TO '${file}' (FORMAT PARQUET)`);
      manifest.tables.push(table);
    } else if (sql.startsWith('CREATE ')) {
      // table or view
      if (view_re.test(sql)) continue; // ignore views
      const table = sql.match(table_re)?.[3];
      const file = path.resolve(dir, `${table}.parquet`);
      await db.exec(`${sql}`);
      await db.exec(`COPY ${table} TO '${file}' (FORMAT PARQUET)`);
      manifest.tables.push(table);
    } else if (!pragma_re.test(sql)) {
      // select query
      const type = describe_re.test(sql) ? 'json' : 'arrow';
      const key = cacheKey(sql, type);
      const result = await retrieve(db, cache, sql, type);
      await fs.writeFile(path.resolve(dir, key), result);
      manifest.queries.push(key);
    }
  }

  await fs.writeFile(path.resolve(dir, 'bundle.json'), JSON.stringify(manifest, 0, 2));
  return manifest;
}

export async function loadBundle(db, cache, dir) {
  const manifest = JSON.parse(await fs.readFile(path.resolve(dir, 'bundle.json')));

  // load precomputed query results into the cache
  for (const key of manifest.queries) {
    const file = path.resolve(dir, key);
    const json = path.extname(file) === '.json';
    const data = await fs.readFile(file);
    cache.set(key, json ? JSON.parse(data) : data);
  }

  // load precomputed temp tables into the database
  for (const table of manifest.tables) {
    const file = path.resolve(dir, `${table}.parquet`);
    await db.exec(`CREATE TEMP TABLE IF NOT EXISTS ${table} AS SELECT * FROM '${file}'`);
  }
}
