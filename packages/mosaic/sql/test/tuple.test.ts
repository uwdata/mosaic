import { expect, describe, it } from 'vitest';
import { TupleNode, literal, tuple } from '../src/index.js';

describe('tuple', () => {
  it('ast node renders a parenthesized list of values', async () => {
    const t = new TupleNode([literal(1), literal(2), literal(3)]);
    await expect(t).toBeValidExpr('(1, 2, 3)');
  });

  it('function accepts expression node values', async () => {
    const t = tuple([literal(1), literal(2), literal(3)]);
    await expect(t).toBeValidExpr('(1, 2, 3)');
  });

  it('function accepts literal values', async () => {
    const t = tuple(['a', 'b', 'c'])
    await expect(t).toBeValidExpr(`('a', 'b', 'c')`);
  });
});
