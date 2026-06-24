import { expect, describe, it } from 'vitest';
import { isFinite, isInfinite, isNaN } from '../src/index.js';
import { columns } from './util/columns.js';

describe('Number functions', () => {
  it('include isNaN', async () => {
    const expr = isNaN('num1')
    await expect(expr).toBeValidExpr(`isnan("num1")`);
    expect(expr.name).toBe('isnan');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toEqual(['num1']);
  });
  it('include isFinite', async () => {
    const expr = isFinite('num1')
    await expect(expr).toBeValidExpr(`isfinite("num1")`);
    expect(expr.name).toBe('isfinite');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toEqual(['num1']);
  });
  it('include isInfinite', async () => {
    const expr = isInfinite('num1')
    await expect(expr).toBeValidExpr(`isinf("num1")`);
    expect(expr.name).toBe('isinf');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toEqual(['num1']);
  });
});
