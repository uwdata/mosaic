import { expect, describe, it } from 'vitest';
import { stubParam } from './util/stub-param.js';
import { column, isParamLike, sql } from '../src/index.js';
import { columns, params } from './util/columns.js';

describe('sql expression', () => {
  it('creates basic SQL expressions', async () => {
    const expr = sql`1 + 1`;
    await expect(expr).toBeValidExpr('1 + 1');
    expect(columns(expr)).toEqual([]);
    expect(params(expr)).toEqual([]);
  });

  it('creates interpolated SQL expressions', async () => {
    const expr = sql`${column('foo')} * ${column('bar')}`;
    await expect(expr).toBeValidExpr('"foo" * "bar"');
    expect(columns(expr)).toEqual(['foo', 'bar']);
    expect(params(expr)).toEqual([]);
  });

  it('creates nested SQL expressions', async () => {
    const base = sql`${column('foo')} * 4`;
    const expr = sql`${base} + 1`;
    await expect(expr).toBeValidExpr('"foo" * 4 + 1');
    expect(columns(expr)).toEqual(['foo']);
    expect(params(expr)).toEqual([]);
  });

  it('creates parameterized SQL expressions', async () => {
    const param = stubParam(4);
    expect(isParamLike(param)).toBe(true);

    const expr = sql`${column('foo')} * ${param}`;
    await expect(expr).toBeValidExpr('"foo" * 4');
    expect(isParamLike(expr)).toBe(false);
    expect(columns(expr)).toEqual(['foo']);
    expect(params(expr)).toEqual([param]);

    param.update(5);
    await expect(expr).toBeValidExpr('"foo" * 5');
  });

  it('creates nested parameterized SQL expressions', async () => {
    const param = stubParam(4);
    expect(isParamLike(param)).toBe(true);

    const base = sql`${column('foo')} * ${param}`;
    const expr = sql`${base} + 1`;
    await expect(expr).toBeValidExpr('"foo" * 4 + 1');
    expect(isParamLike(expr)).toBe(false);
    expect(columns(expr)).toEqual(['foo']);
    expect(params(expr)).toEqual([param]);

    param.update(5);
    await expect(expr).toBeValidExpr('"foo" * 5 + 1');
  });
});
