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
    const expr = sql`${column('num1')} * ${column('num2')}`;
    await expect(expr).toBeValidExpr('"num1" * "num2"');
    expect(columns(expr)).toEqual(['num1', 'num2']);
    expect(params(expr)).toEqual([]);
  });

  it('creates nested SQL expressions', async () => {
    const base = sql`${column('num1')} * 4`;
    const expr = sql`${base} + 1`;
    await expect(expr).toBeValidExpr('"num1" * 4 + 1');
    expect(columns(expr)).toEqual(['num1']);
    expect(params(expr)).toEqual([]);
  });

  it('creates parameterized SQL expressions', async () => {
    const param = stubParam(4);
    expect(isParamLike(param)).toBe(true);

    const expr = sql`${column('num1')} * ${param}`;
    await expect(expr).toBeValidExpr('"num1" * 4');
    expect(isParamLike(expr)).toBe(false);
    expect(columns(expr)).toEqual(['num1']);
    expect(params(expr)).toEqual([param]);

    param.update(5);
    await expect(expr).toBeValidExpr('"num1" * 5');
  });

  it('creates nested parameterized SQL expressions', async () => {
    const param = stubParam(4);
    expect(isParamLike(param)).toBe(true);

    const base = sql`${column('num1')} * ${param}`;
    const expr = sql`${base} + 1`;
    await expect(expr).toBeValidExpr('"num1" * 4 + 1');
    expect(isParamLike(expr)).toBe(false);
    expect(columns(expr)).toEqual(['num1']);
    expect(params(expr)).toEqual([param]);

    param.update(5);
    await expect(expr).toBeValidExpr('"num1" * 5 + 1');
  });
});
