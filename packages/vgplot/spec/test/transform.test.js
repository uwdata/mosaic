import { expect, it } from 'vitest';
import { cpcEstimate, cpcSketch, isAggregateExpression, kllQuantile, kllSketch, sql, sum } from '@uwdata/mosaic-sql';
import { parseSpec } from '../src/index.js';

it('instantiates nested transforms and SQL expressions', () => {
  const ast = parseSpec({
    plot: [{
      mark: 'lineY',
      data: { from: 'sales' },
      x: 'day',
      y: { sum: { sum: { sql: 'amount' } }, orderby: 'day' },
    }],
  });
  // @ts-expect-error options is not a property of ASTNode
  const actual = ast.root.children[0].options.instantiate({ api: { sql, sum } }).y;
  expect(isAggregateExpression(actual)).toBe(1);
  expect(String(actual)).toBe(String(sum(sum(sql`amount`)).orderby('day')));
});

it('instantiates sketch transforms', () => {
  const ast = parseSpec({
    plot: [{
      mark: 'barY',
      data: { from: 'sales' },
      x: 'day',
      y: { cpcEstimate: { cpcSketch: 'customer' } },
      y2: { kllQuantile: [{ kllSketch: ['amount', 100] }, 0.5] },
    }],
  });
  const api = { cpcEstimate, cpcSketch, kllQuantile, kllSketch };
  const { y, y2 } = ast.root.children[0].options.instantiate({ api });
  expect(isAggregateExpression(y)).toBe(1);
  expect(String(y)).toBe(String(cpcEstimate(cpcSketch('customer'))));
  expect(isAggregateExpression(y2)).toBe(1);
  expect(String(y2)).toBe(String(kllQuantile(kllSketch('amount', 100), 0.5)));
});
