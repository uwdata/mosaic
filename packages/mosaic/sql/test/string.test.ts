import { expect, describe, it } from 'vitest';
import { contains, literal, length, lower, prefix, regexp_matches, suffix, upper } from '../src/index.js';
import { columns } from './util/columns.js';

describe('String functions', () => {
  it('include regexp_matches', async () => {
    const expr = regexp_matches('txt1', literal('(an)*'))
    await expect(expr).toBeValidExpr(`regexp_matches("txt1", '(an)*')`);
    expect(expr.name).toBe('regexp_matches');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['txt1']);
  });

  it('include contains', async () => {
    const expr = contains('txt1', literal('oo'))
    await expect(expr).toBeValidExpr(`contains("txt1", 'oo')`);
    expect(expr.name).toBe('contains');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['txt1']);
  });

  it('include prefix', async () => {
    const expr = prefix('txt1', literal('fo'))
    await expect(expr).toBeValidExpr(`starts_with("txt1", 'fo')`);
    expect(expr.name).toBe('starts_with');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['txt1']);
  });

  it('include suffix', async () => {
    const expr = suffix('txt1', literal('oo'))
    await expect(expr).toBeValidExpr(`ends_with("txt1", 'oo')`);
    expect(expr.name).toBe('ends_with');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['txt1']);
  });

  it('include lower', async () => {
    const expr = lower('txt1')
    await expect(expr).toBeValidExpr(`lower("txt1")`);
    expect(expr.name).toBe('lower');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toStrictEqual(['txt1']);
  });

  it('include upper', async () => {
    const expr = upper('txt1')
    await expect(expr).toBeValidExpr(`upper("txt1")`);
    expect(expr.name).toBe('upper');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toStrictEqual(['txt1']);
  });

  it('include length', async () => {
    const expr = length('txt1')
    await expect(expr).toBeValidExpr(`length("txt1")`);
    expect(expr.name).toBe('length');
    expect(expr.args.length).toBe(1);
    expect(columns(expr)).toStrictEqual(['txt1']);
  });
});
