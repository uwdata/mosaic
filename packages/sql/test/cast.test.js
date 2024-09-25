import { expect, describe, it } from 'vitest';
import { avg, cast, castDouble, castInteger, column } from '../src/index.js';

describe('cast', () => {
  it('performs type casts', () => {
    expect(String(cast('foo', 'DOUBLE'))).toBe('CAST("foo" AS DOUBLE)');
    expect(String(cast(column('foo'), 'DOUBLE'))).toBe('CAST("foo" AS DOUBLE)');

    const expr = cast(avg('bar'), 'DOUBLE');
    expect(String(expr)).toBe('CAST(AVG("bar") AS DOUBLE)');
    expect(expr.aggregate).toBe('AVG');
    expect(expr.column).toBe('bar');
    expect(expr.columns).toEqual(['bar']);
    expect(expr.label).toBe('avg(bar)');
  });
  it('performs double casts', () => {
    expect(String(castDouble('foo'))).toBe('CAST("foo" AS DOUBLE)');
    expect(String(castDouble(column('foo')))).toBe('CAST("foo" AS DOUBLE)');

    const expr = castDouble(avg('bar'));
    expect(String(expr)).toBe('CAST(AVG("bar") AS DOUBLE)');
    expect(expr.aggregate).toBe('AVG');
    expect(expr.column).toBe('bar');
    expect(expr.columns).toEqual(['bar']);
    expect(expr.label).toBe('avg(bar)');
  });
  it('performs integer casts', () => {
    expect(String(castInteger('foo'))).toBe('CAST("foo" AS INTEGER)');
    expect(String(castInteger(column('foo')))).toBe('CAST("foo" AS INTEGER)');

    const expr = castInteger(avg('bar'));
    expect(String(expr)).toBe('CAST(AVG("bar") AS INTEGER)');
    expect(expr.aggregate).toBe('AVG');
    expect(expr.column).toBe('bar');
    expect(expr.columns).toEqual(['bar']);
    expect(expr.label).toBe('avg(bar)');
  });
});
