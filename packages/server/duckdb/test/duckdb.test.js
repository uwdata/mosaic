import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path'
import { tableFromIPC } from '@uwdata/flechette';
import { db } from './db.js';
import { loadArrow, loadJSON } from '../src/index.js';

describe('DuckDB', () => {
  beforeAll(async () => {
    const file = path.resolve(__dirname, '../../../../data/penguins.csv');
    await db.exec(`CREATE TABLE penguins AS SELECT * FROM '${file}'`);
  });

  afterAll(async () => {
    await db.exec('DROP TABLE penguins');
  });

  describe('arrowBuffer', () => {
    it('returns arrow ipc buffers', async () => {
      const chunks = await db.arrowBuffer('SELECT * FROM penguins');
      expect(Array.isArray(chunks)).toBe(true);
      const table = tableFromIPC(chunks);
      expect(table.numRows).toBe(342);
      expect(table.numCols).toBe(7);
    });

    it('handles empty results', async () => {
      const result = await db.arrowBuffer('SELECT * FROM penguins WHERE 1 = 0');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('handles DESC queries', async () => {
      const result = await db.arrowBuffer('DESC SELECT * FROM penguins');
      const table = tableFromIPC(result);
      expect(table.numRows).toBe(7);
    });
  });

  describe('loadArrow', () => {
    it('loads an arrow ipc buffer', async () => {
      await loadArrow(db, 'arrow', await db.arrowBuffer('SELECT * FROM penguins'));
      const res = await db.query('SELECT count()::INTEGER AS count FROM arrow');
      expect(res[0]?.count).toBe(342);
      await db.exec('DROP TABLE arrow');
    });
  });

  describe('loadJSON', () => {
    it('loads a json file', async () => {
      await loadJSON(db, 'json', path.resolve(__dirname, '../../../../data/penguins.json'));
      const res = await db.query('SELECT count()::INTEGER AS count FROM json');
      expect(res[0]?.count).toBe(342);
      await db.exec('DROP TABLE json');
    });
  });
});
