import { expect, it, assert} from 'vitest';
import { isAggregateExpression, sql, sum } from '@uwdata/mosaic-sql';
import { OptionsNode, parseSpec} from '../src/index.js';

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
  const actual = options.instantiate({ api: { sql, sum } }).y;
  expect(isAggregateExpression(actual)).toBe(1);
  expect(String(actual)).toBe(String(sum(sum(sql`amount`)).orderby('day')));
});
