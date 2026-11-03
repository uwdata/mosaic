import { expect, describe, it } from 'vitest';
import { columns } from './util/columns.js';
import { add, deepClone, PositionalRefNode, positionalRef, Query, subscript } from '../src/index.js';

describe('positionalRef', () => {
  it('generates positional references', async () => {
    await expect(positionalRef(1)).toBeValidExpr('#1');
    await expect(add(positionalRef(1), 1)).toBeValidExpr('(#1 + 1)');
    await expect(subscript(positionalRef(9), 1)).toBeValidExpr('#9[1]');
  });

  it('generates positional references in queries', async () => {
    await expect(Query.select({ x: positionalRef(2) }).from('t1').orderby(positionalRef(1)))
      .toBeValidQuery('SELECT #2 AS "x" FROM "t1" ORDER BY #1');
  });

  it('collects positional references as all columns', () => {
    expect(columns(add(positionalRef(1), 'num1'))).toStrictEqual(['*', 'num1']);
  });

  it('supports cloning', () => {
    const clone = deepClone(positionalRef(3));
    expect(clone).toBeInstanceOf(PositionalRefNode);
    expect(`${clone}`).toBe('#3');
  });
});
