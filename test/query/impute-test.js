import assert from 'node:assert';
import { DuckDB } from '../../src/index.js';
import { impute } from '../../src/query/impute.js';

const db = new DuckDB();

describe('impute', () => {
  before(async () => {
    const data = [
      { c: 0, x: 0, y: 28 },
      { c: 0, x: 1, y: 43 },
      { c: 0, x: 2, y: 81 },
      { c: 0, x: 3, y: 19 },
      { c: 1, x: 0, y: 55 },
      { c: 1, x: 1, y: 91 },
      { c: 1, x: 2, y: null }
    ];
    await db.exec(`
    CREATE TABLE data (x INTEGER, y INTEGER, c INTEGER);
    INSERT INTO data VALUES ${data.map(d => `(${d.x}, ${d.y}, ${d.c})`).join(',')};
    `);
  });

  after(async () => {
    await db.exec(`DROP TABLE data;`);
  });

  it('imputes constant values', async () => {
    const expected = [
      { c: 0, x: 0, y: 28 },
      { c: 0, x: 1, y: 43 },
      { c: 0, x: 2, y: 81 },
      { c: 0, x: 3, y: 19 },
      { c: 1, x: 0, y: 55 },
      { c: 1, x: 1, y: 91 },
      { c: 1, x: 2, y: 13 }
    ];
    assert.deepStrictEqual(
      await db.query(impute('data', 'y', 13)),
      expected
    );
  });

  it('imputes aggregate values', async () => {
    const expected = [
      { c: 0, x: 0, y: 28 },
      { c: 0, x: 1, y: 43 },
      { c: 0, x: 2, y: 81 },
      { c: 0, x: 3, y: 19 },
      { c: 1, x: 0, y: 55 },
      { c: 1, x: 1, y: 91 },
      { c: 1, x: 2, y: 19 }
    ];
    assert.deepStrictEqual(
      await db.query(impute('data', 'y', 'MIN(y)')),
      expected
    );
  });

  it('imputes grouped values', async () => {
    const expected = [
      { c: 0, x: 0, y: 28 },
      { c: 0, x: 1, y: 43 },
      { c: 0, x: 2, y: 81 },
      { c: 0, x: 3, y: 19 },
      { c: 1, x: 0, y: 55 },
      { c: 1, x: 1, y: 91 },
      { c: 1, x: 2, y: 55 }
    ];
    assert.deepStrictEqual(
      await db.query(impute('data', 'y', 'MIN(y)', 'c')),
      expected
    );
    assert.deepStrictEqual(
      await db.query(impute('data', 'y', 'MIN(y)', ['c'])),
      expected
    );
  });

  it('imputes expanded values', async () => {
    const expected = [
      { c: 0, x: 0, y: 28 },
      { c: 0, x: 1, y: 43 },
      { c: 0, x: 2, y: 81 },
      { c: 0, x: 3, y: 19 },
      { c: 1, x: 0, y: 55 },
      { c: 1, x: 1, y: 91 },
      { c: 1, x: 2, y: 13 },
      { c: 1, x: 3, y: 13 }
    ];
    assert.deepStrictEqual(
      await db.query(impute('data', 'y', 13, null, ['c', 'x'])),
      expected
    );
    assert.deepStrictEqual(
      await db.query(impute('data', 'y', 13, [], ['c', 'x'])),
      expected
    );
  });

  it('imputes expanded aggregate values', async () => {
    const expected = [
      { c: 0, x: 0, y: 28 },
      { c: 0, x: 1, y: 43 },
      { c: 0, x: 2, y: 81 },
      { c: 0, x: 3, y: 19 },
      { c: 1, x: 0, y: 55 },
      { c: 1, x: 1, y: 91 },
      { c: 1, x: 2, y: 19 },
      { c: 1, x: 3, y: 19 }
    ];
    assert.deepStrictEqual(
      await db.query(impute('data', 'y', 'MIN(y)', null, ['c', 'x'])),
      expected
    );
    assert.deepStrictEqual(
      await db.query(impute('data', 'y', 'MIN(y)', [], ['c', 'x'])),
      expected
    );
  });

  it('imputes grouped and expanded values', async () => {
    const expected = [
      { c: 0, x: 0, y: 28 },
      { c: 0, x: 1, y: 43 },
      { c: 0, x: 2, y: 81 },
      { c: 0, x: 3, y: 19 },
      { c: 1, x: 0, y: 55 },
      { c: 1, x: 1, y: 91 },
      { c: 1, x: 2, y: 55 },
      { c: 1, x: 3, y: 55 }
    ];
    assert.deepStrictEqual(
      await db.query(impute('data', 'y', 'MIN(y)', 'c', 'x')),
      expected
    );
    assert.deepStrictEqual(
      await db.query(impute('data', 'y', 'MIN(y)', ['c'], ['x'])),
      expected
    );
  });
});
