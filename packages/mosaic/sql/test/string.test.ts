import { expect, describe, it } from 'vitest';
import { contains, literal, length, lower, prefix, regexp_matches, suffix, upper } from '../src/index.js';
import { columns } from './util/columns.js';

describe('String functions', () => {
  it('include regexp_matches', () => {
    const expr = regexp_matches('foo', literal('(an)*'))
    expect(String(expr)).toBe(`regexp_matches("foo", '(an)*')`);
    expect(expr.name).toBe('regexp_matches');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include contains', () => {
    const expr = contains('foo', literal('oo'))
    expect(String(expr)).toBe(`contains("foo", 'oo')`);
    expect(expr.name).toBe('contains');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include prefix', () => {
    const expr = prefix('foo', literal('fo'))
    expect(String(expr)).toBe(`starts_with("foo", 'fo')`);
    expect(expr.name).toBe('starts_with');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include suffix', () => {
    const expr = suffix('foo', literal('oo'))
    expect(String(expr)).toBe(`ends_with("foo", 'oo')`);
    expect(expr.name).toBe('ends_with');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include lower', () => {
    const expr = lower('foo')
    expect(String(expr)).toBe(`lower("foo")`);
    expect(expr.name).toBe('lower');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include upper', () => {
    const expr = upper('foo')
    expect(String(expr)).toBe(`upper("foo")`);
    expect(expr.name).toBe('upper');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include length', () => {
    const expr = length('foo')
    expect(String(expr)).toBe(`length("foo")`);
    expect(expr.name).toBe('length');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toStrictEqual(['foo']);
  });
});
