import { expect, describe, it } from 'vitest';
import {
  contains, isFinite, isInfinite, isNaN, literal, length,
  lower, prefix, regexp_matches, suffix, upper
} from '../src/index.js';

describe('Function calls', () => {
  it('includes REGEXP_MATCHES', () => {
    const expr = regexp_matches('foo', literal('(an)*'))
    expect(String(expr)).toBe(`REGEXP_MATCHES("foo", '(an)*')`);
    expect(expr.func).toBe('REGEXP_MATCHES');
    expect(expr.args.length).toBe(2);
    expect(expr.columns).toEqual(['foo']);
  });
  it('includes CONTAINS', () => {
    const expr = contains('foo', literal('oo'))
    expect(String(expr)).toBe(`CONTAINS("foo", 'oo')`);
    expect(expr.func).toBe('CONTAINS');
    expect(expr.args.length).toBe(2);
    expect(expr.columns).toEqual(['foo']);
  });
  it('includes PREFIX', () => {
    const expr = prefix('foo', literal('fo'))
    expect(String(expr)).toBe(`PREFIX("foo", 'fo')`);
    expect(expr.func).toBe('PREFIX');
    expect(expr.args.length).toBe(2);
    expect(expr.columns).toEqual(['foo']);
  });
  it('includes SUFFIX', () => {
    const expr = suffix('foo', literal('oo'))
    expect(String(expr)).toBe(`SUFFIX("foo", 'oo')`);
    expect(expr.func).toBe('SUFFIX');
    expect(expr.args.length).toBe(2);
    expect(expr.columns).toEqual(['foo']);
  });
  it('includes LOWER', () => {
    const expr = lower('foo')
    expect(String(expr)).toBe(`LOWER("foo")`);
    expect(expr.func).toBe('LOWER');
    expect(expr.args.length).toBe(1);
    expect(expr.columns).toEqual(['foo']);
  });
  it('includes UPPER', () => {
    const expr = upper('foo')
    expect(String(expr)).toBe(`UPPER("foo")`);
    expect(expr.func).toBe('UPPER');
    expect(expr.args.length).toBe(1);
    expect(expr.columns).toEqual(['foo']);
  });
  it('includes LENGTH', () => {
    const expr = length('foo')
    expect(String(expr)).toBe(`LENGTH("foo")`);
    expect(expr.func).toBe('LENGTH');
    expect(expr.args.length).toBe(1);
    expect(expr.columns).toEqual(['foo']);
  });
  it('includes ISNAN', () => {
    const expr = isNaN('foo')
    expect(String(expr)).toBe(`ISNAN("foo")`);
    expect(expr.func).toBe('ISNAN');
    expect(expr.args.length).toBe(1);
    expect(expr.columns).toEqual(['foo']);
  });
  it('includes ISFINITE', () => {
    const expr = isFinite('foo')
    expect(String(expr)).toBe(`ISFINITE("foo")`);
    expect(expr.func).toBe('ISFINITE');
    expect(expr.args.length).toBe(1);
    expect(expr.columns).toEqual(['foo']);
  });
  it('includes ISINF', () => {
    const expr = isInfinite('foo')
    expect(String(expr)).toBe(`ISINF("foo")`);
    expect(expr.func).toBe('ISINF');
    expect(expr.args.length).toBe(1);
    expect(expr.columns).toEqual(['foo']);
  });
});
