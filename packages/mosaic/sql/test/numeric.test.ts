import { expect, describe, it } from 'vitest';
import { isFinite, isInfinite, isNaN } from '../src/index.js';
import { columns } from './util/columns.js';

describe('Number functions', () => {
  it('include isNaN', async () => {
    const expr = isNaN('foo')
    await expect(expr).toBeValidExpr(`isnan("foo")`);
    expect(expr.name).toBe('isnan');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toEqual(['foo']);
  });
  it('include isFinite', async () => {
    const expr = isFinite('foo')
    await expect(expr).toBeValidExpr(`isfinite("foo")`);
    expect(expr.name).toBe('isfinite');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toEqual(['foo']);
  });
  it('include isInfinite', async () => {
    const expr = isInfinite('foo')
    await expect(expr).toBeValidExpr(`isinf("foo")`);
    expect(expr.name).toBe('isinf');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toEqual(['foo']);
  });
});
