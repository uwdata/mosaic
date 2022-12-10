import assert from 'node:assert';
import { mergeBuffers } from '../../src/duckdb/merge-buffers.js';
import { db } from '../db.js';

describe('DuckDB', () => {
  before(async () => {
    await db.csv('penguins', 'data/penguins.csv');
  });

  after(async () => {
    await db.exec(`DROP TABLE penguins;`);
  });

  describe('arrowBuffer', () => {
    it('returns arrow ipc buffers', async () => {
      const buf = await db.arrowBuffer('SELECT * FROM penguins');
      assert.strictEqual(buf.length, 22144);
    });
  });

  describe('arrowStream', () => {
    it('returns arrow ipc stream', async () => {
      const ipcbuf = await db.arrowBuffer('SELECT * FROM penguins');
      const stream = await db.arrowStream('SELECT * FROM penguins');
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      assert.deepStrictEqual(mergeBuffers(chunks), ipcbuf);
    });
  });

});
