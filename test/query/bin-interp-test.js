import assert from 'node:assert';
import { DuckDB } from '../../src/index.js';
import { binInterp } from '../../src/query/bin-interp.js';

const db = new DuckDB();

function compare(actual, expected) {
  for (let i = 0, n = actual.length; i < n; ++i) {
    const a = actual[i];
    const e = expected[i];
    assert.strictEqual(a.index, e.index);
    assert.ok(Math.abs(a.weight - e.weight) < 1e-14);
  }
}

describe('binInterp', () => {
  before(async () => {
    const data = [
      { x: 0, w: 1 },
      { x: 1, w: 2 },
      { x: 1.5, w: 1 },
      { x: 2, w: 2 },
      { x: 3, w: 1 },
      { x: 0, w: 1},
      { x: 1, w: 1 },
      { x: 2, w: 1 }
    ];
    await db.exec(`
    CREATE TABLE data (x DOUBLE, w DOUBLE);
    INSERT INTO data VALUES ${data.map(d => `(${d.x}, ${d.w})`).join(',')};
    `);
  });

  after(async () => {
    await db.exec(`DROP TABLE data;`);
  });

  it('interpolates binned counts', async () => {
    compare(
      await db.query(binInterp('data', 'x', 0, 3, 1)),
      [ { index: 0, weight: 8 } ]
    );

    compare(
      await db.query(binInterp('data', 'x', 0, 3, 2)),
      [ { index: 0, weight: 4.5 }, { index: 1, weight: 3.5 } ]
    );

    compare(
      await db.query(binInterp('data', 'x', 0, 3, 3)),
      [
        { index: 0, weight: 8 / 3 },
        { index: 1, weight: 11 / 3 },
        { index: 2, weight: 5 / 3 }
      ]
    );

    compare(
      await db.query(binInterp('data', 'x', 0, 3, 4)),
      [
        { index: 0, weight: 2 },
        { index: 1, weight: 2.5 },
        { index: 2, weight: 2.5 },
        { index: 3, weight: 1 }
      ]
    );
  });

  it('interpolates binned weights', async () => {
    compare(
      await db.query(binInterp('data', 'x', 0, 3, 1, 'w')),
      [ { index: 0, weight: 10 } ]
    );

    compare(
      await db.query(binInterp('data', 'x', 0, 3, 2, 'w')),
      [ { index: 0, weight: 5.5 }, { index: 1, weight: 4.5 } ]
    );

    compare(
      await db.query(binInterp('data', 'x', 0, 3, 3, 'w')),
      [
        { index: 0, weight: 3 },
        { index: 1, weight: 5 },
        { index: 2, weight: 2 }
      ]
    );

    compare(
      await db.query(binInterp('data', 'x', 0, 3, 4, 'w')),
      [
        { index: 0, weight: 2 },
        { index: 1, weight: 3.5 },
        { index: 2, weight: 3.5 },
        { index: 3, weight: 1 }
      ]
    );
  });
});
