import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path'
import { db } from './db.js';
import { loadJSON } from '../src/index.js';

describe('DuckDB', () => {
  beforeAll(async () => {
    const file = path.resolve(__dirname, '../../../data/penguins.csv');
    await db.exec(`CREATE TABLE penguins AS SELECT * FROM '${file}'`);
  });

  afterAll(async () => {
    await db.exec('DROP TABLE penguins');
  });

  describe('arrowBuffer', () => {
    it('returns arrow ipc buffers', async () => {
      const buf = await db.arrowBuffer('SELECT * FROM penguins');
      expect(buf.length).toBe(22052);
    });
  });

  // suppress test until duckdb bug is fixed
  // describe('loadArrow', () => {
  //   it('loads an arrow ipc buffer', async () => {
  //     await loadArrow(db, 'arrow', await db.arrowBuffer('SELECT * FROM penguins'));
  //     const res = await db.query('SELECT count()::INTEGER AS count FROM arrow');
  //     expect(res[0]?.count).toBe(342);
  //     await db.exec('DROP VIEW arrow');
  //   });
  // });

  describe('loadJSON', () => {
    it('loads a json file', async () => {
      await loadJSON(db, 'json', path.resolve(__dirname, '../../../data/penguins.json'));
      const res = await db.query('SELECT count()::INTEGER AS count FROM json');
      expect(res[0]?.count).toBe(342);
      await db.exec('DROP TABLE json');
    });
  });
});
