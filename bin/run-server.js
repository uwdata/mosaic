#! /usr/bin/env node
import { DuckDB, JSONDataService, launchServer } from '../src/index.js';

const t0 = Date.now();

const data1 = [
  { x: 'a', y: 12 },
  { x: 'b', y: 56 },
  { x: 'c', y: 30 },
  { x: 'd', y: 27 },
  { x: 'e', y: 46 },
  { x: 'f', y:  9 },
  { x: 'g', y: 32 },
  { x: 'h', y: 64 },
  { x: 'i', y: 51 },
  { x: 'j', y: 22 },
];

const data2 = Array.from(
  { length: 500001 },
  () => {
    const u = Math.random();
    return { u, v: 0.5 + u/5 + 0.5 * (Math.random() - 0.5) };
  }
);

let p = 0;
const data3 = Array.from(
  { length: 50001 },
  (_, t) => {
    const v = p + 2 * (Math.random() - 0.5)
    p = v;
    return { t, v };
  }
);

const db = new DuckDB();
const ds = new JSONDataService(db);

await Promise.all([
  db.csv('athletes', 'data/athletes.csv'),
  db.csv('penguins', 'data/penguins.csv'),
  db.add('data1', data1, { x: 'VARCHAR', y: 'INTEGER' }),
  db.add('data2', data2, { u: 'DOUBLE', v: 'DOUBLE' }),
  db.add('data3', data3, { t: 'DOUBLE', v: 'DOUBLE' })
]);

console.log('SETUP', Date.now() - t0);

launchServer(ds);
