import { expect, describe, it } from 'vitest';
import { isFinite, isInfinite, isNaN } from '../src/index.js';
import { columns } from './util/columns.js';

describe('Number functions', () => {
  it('include isNaN', () => {
    const expr = isNaN('foo')
    expect(String(expr)).toBe(`isnan("foo")`);
    expect(expr.name).toBe('isnan');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toEqual(['foo']);
  });
  it('include isFinite', () => {
    const expr = isFinite('foo')
    expect(String(expr)).toBe(`isfinite("foo")`);
    expect(expr.name).toBe('isfinite');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toEqual(['foo']);
  });
  it('include isInfinite', () => {
    const expr = isInfinite('foo')
    expect(String(expr)).toBe(`isinf("foo")`);
    expect(expr.name).toBe('isinf');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toEqual(['foo']);
  });
});
