import assert from 'node:assert';
import { db } from './db.js';
import { loadArrow } from '../src/index.js';

describe('DuckDB', () => {
  before(async () => {
    const file = '../../data/penguins.csv';
    await db.exec(`CREATE TEMP TABLE penguins AS SELECT * FROM '${file}'`);
  });

  after(async () => {
    await db.exec('DROP TABLE penguins');
  });

  describe('arrowBuffer', () => {
    it('returns arrow ipc buffers', async () => {
      const buf = await db.arrowBuffer('SELECT * FROM penguins');
      assert.strictEqual(buf.length, 22052);
    });
  });

  describe('loadArrow', () => {
    it('loads an arrow ipc buffer', async () => {
      await loadArrow(db, 'arrow', await db.arrowBuffer('SELECT * FROM penguins'));
      const res = await db.query('SELECT count() AS count FROM arrow');
      assert.strictEqual(res[0]?.count, 342);
      await db.exec('DROP VIEW arrow');
    });
  });
});
