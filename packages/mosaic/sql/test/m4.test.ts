import { expect, describe, it } from 'vitest';
import { column, div, m4, Query } from '../src/index.js';
import { queryFixture } from './util/validate.js';

describe('m4', () => {
  it('aggregates in a single grouped query', async () => {
    await expect(m4('t1', div('num1', 10), 'num1', 'num2', [column('txt1')]))
      .toBeValidQuery(
        'SELECT DISTINCT UNNEST([min("num1"), max("num1"), arg_min("num1", "num2"), arg_max("num1", "num2")]) AS "num1", '
        + 'UNNEST([arg_min("num2", "num1"), arg_max("num2", "num1"), min("num2"), max("num2")]) AS "num2", "txt1" '
        + 'FROM "t1" GROUP BY (floor(("num1" / 10)))::INTEGER, "txt1" ORDER BY "txt1", "num1"'
      );
  });

  it('keeps the first, last, minimum, and maximum point per pixel', async () => {
    const input = Query.from('src').select('*');
    const values = '(0, 5), (1, 9), (2, 1), (3, 4), (4, 6), (5, 2), (6, 3), (7, 3)';
    const rows = await queryFixture(
      `WITH src(x, y) AS (VALUES ${values}) ${m4(input, div('x', 4), 'x', 'y')}`
    );
    expect(rows.map(r => [r.x, r.y])).toEqual([
      [0, 5], [1, 9], [2, 1], [3, 4], [4, 6], [5, 2], [7, 3]
    ]);
  });
});
