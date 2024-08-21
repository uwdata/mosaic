import assert from 'node:assert';
import { db } from './db.js';
import { loadArrow, loadJSON } from '../src/index.js';

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
      const res = await db.query('SELECT count()::INTEGER AS count FROM arrow');
      assert.strictEqual(res[0]?.count, 342);
      await db.exec('DROP VIEW arrow');
    });
  });

  describe('loadJSON', () => {
    it('loads a json file', async () => {
      await loadJSON(db, 'json', '../../data/penguins.json');
      const res = await db.query('SELECT count()::INTEGER AS count FROM json');
      assert.strictEqual(res[0]?.count, 342);
      await db.exec('DROP TABLE json');
    });
  });

  describe('prepare', () => {
    it('can run a prepared statement', async () => {
      const statement = db.prepare('SELECT ?+? AS foo');
      const res0 = await statement.query([1,2]);
      assert.deepEqual(res0, [{foo: 3}]);

      const res1 = await statement.query([2,3]);
      assert.deepEqual(res1, [{foo: 5}]);
    });

    it('can run a prepared arrow statement', async () => {
      const statement = db.prepare('SELECT ?+? AS foo');
      const res0 = await statement.arrowBuffer([1,2]);
      assert.deepEqual(res0, [{foo: 3}]);

      const res1 = await statement.arrowBuffer([2,3]);
      assert.deepEqual(res1, [{foo: 5}]);
    });
  });
});
