import assert from 'node:assert';
import { db } from '../db.js';
import { loadJSON } from '../../src/duckdb/load-json.js';

describe('loadJSON', () => {

  after(async () => {
    db.exec(`DROP TABLE json;`);
  });

  it('ingests json data', async () => {
    const data = [{ x: 0, w: 1 }, { x: 1, w: 2 }];
    await loadJSON(db, 'json', data, { x: 'DOUBLE', w: 'DOUBLE' });
    const result = await db.query('SELECT * FROM json');
    assert.deepStrictEqual(result, data);
  });

});
