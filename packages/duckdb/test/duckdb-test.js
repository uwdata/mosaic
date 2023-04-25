import assert from 'node:assert';
import { db } from './db.js';
import { loadArrow, loadCSV } from '../src/index.js';

describe('DuckDB', () => {
  before(async () => {
    await loadCSV(db, 'penguins', '../../data/penguins.csv');
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

  describe('ipc', () => {
    it('loads an arrow ipc buffer', async () => {
      await loadArrow(db, 'arrow', await db.arrowBuffer('SELECT * FROM penguins'));
      const res = await db.query('SELECT count() AS count FROM arrow');
      assert.strictEqual(res[0]?.count, 342);
      await db.exec('DROP TABLE arrow');
    });
  });
});
