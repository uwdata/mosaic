import { expect, describe, it } from 'vitest';
import { contains, literal, length, lower, prefix, regexp_matches, suffix, upper } from '../src/index.js';
import { columns } from './util/columns.js';

describe('String functions', () => {
  it('include regexp_matches', async () => {
    const expr = regexp_matches('foo', literal('(an)*'))
    await expect(expr).toBeValidExpr(`regexp_matches("foo", '(an)*')`, 'strings');
    expect(expr.name).toBe('regexp_matches');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include contains', async () => {
    const expr = contains('foo', literal('oo'))
    await expect(expr).toBeValidExpr(`contains("foo", 'oo')`, 'strings');
    expect(expr.name).toBe('contains');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include prefix', async () => {
    const expr = prefix('foo', literal('fo'))
    await expect(expr).toBeValidExpr(`starts_with("foo", 'fo')`, 'strings');
    expect(expr.name).toBe('starts_with');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include suffix', async () => {
    const expr = suffix('foo', literal('oo'))
    await expect(expr).toBeValidExpr(`ends_with("foo", 'oo')`, 'strings');
    expect(expr.name).toBe('ends_with');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include lower', async () => {
    const expr = lower('foo')
    await expect(expr).toBeValidExpr(`lower("foo")`, 'strings');
    expect(expr.name).toBe('lower');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include upper', async () => {
    const expr = upper('foo')
    await expect(expr).toBeValidExpr(`upper("foo")`, 'strings');
    expect(expr.name).toBe('upper');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include length', async () => {
    const expr = length('foo')
    await expect(expr).toBeValidExpr(`length("foo")`, 'strings');
    expect(expr.name).toBe('length');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toStrictEqual(['foo']);
  });
});
