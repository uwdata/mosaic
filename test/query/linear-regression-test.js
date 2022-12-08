import assert from 'node:assert';
import { DuckDB } from '../../src/index.js';
import { linearRegression } from '../../src/query/linear-regression.js';

const db = new DuckDB();

describe('linearRegression', () => {
  before(async () => {
    const data = Array.from(
      { length: 10 },
      (_, i) => ({ x: i, y: i + 1, c: i % 2 })
    );
    await db.exec(`
    CREATE TABLE data (x DOUBLE, y DOUBLE, c INTEGER);
    INSERT INTO data VALUES ${data.map(d => `(${d.x}, ${d.y}, ${d.c})`).join(',')};
    `);
  });

  after(async () => {
    await db.exec(`DROP TABLE data;`);
  });

  it('computes linear regression', async () => {
    const result = await db.query(linearRegression('data', 'x', 'y'));
    assert.deepStrictEqual(result, [
      { intercept: 1, slope: 1, n: 10, r2: 1, ssy: 82.5, ssx: 82.5, xm: 4.5, x0: 0, x1: 9 }
    ]);
  });

  it('computes linear regression over groups', async () => {
    const result = await db.query(linearRegression('data', 'x', 'y', 'c'));
    assert.deepStrictEqual(result, [
      { intercept: 1, slope: 1, n: 5, r2: 0.9999999999999996, ssy: 40, ssx: 40, xm: 4, x0: 0, x1: 8 },
      { intercept: 1, slope: 1, n: 5, r2: 0.9999999999999996, ssy: 40, ssx: 40, xm: 5, x0: 1, x1: 9 }
    ]);
  });
});
