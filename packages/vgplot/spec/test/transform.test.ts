import { expect, it, assert} from 'vitest';
import { cpcEstimate, cpcSketch, isAggregateExpression, kllQuantile, kllSketch, sql, sum, isNode } from '@uwdata/mosaic-sql';
import { InstantiateContext, OptionsNode, parseSpec} from '../src/index.js';

it('instantiates nested transforms and SQL expressions', () => {
  const ast = parseSpec({
    plot: [{
      mark: 'lineY',
      data: { from: 'sales' },
      x: 'day',
      y: { sum: { sum: { sql: 'amount' } }, orderby: 'day' },
    }],
  });
  const root = ast.root;
  assert('children' in root)
  const child = root.children[0]
  assert('options' in child)
  const options = child.options
  assert.instanceOf(options, OptionsNode)
  const actual = options.instantiate(new InstantiateContext()).y;
  assert(isNode(actual))
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
  const root = ast.root;
  assert('children' in root)
  const child = root.children[0]
  assert('options' in child)
  const options = child.options
  assert.instanceOf(options, OptionsNode)
  const { y, y2 } = options.instantiate(new InstantiateContext());
  assert(isNode(y))
  expect(isAggregateExpression(y)).toBe(1);
  expect(String(y)).toBe(String(cpcEstimate(cpcSketch('customer'))));
  assert(isNode(y2))
  expect(isAggregateExpression(y2)).toBe(1);
  expect(String(y2)).toBe(String(kllQuantile(kllSketch('amount', 100), 0.5)));
});
