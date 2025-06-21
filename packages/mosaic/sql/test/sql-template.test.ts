import { expect, describe, it } from 'vitest';
import { stubParam } from './util/stub-param.js';
import { column, isParamLike, sql } from '../src/index.js';
import { columns, params } from './util/columns.js';

describe('sql expression', () => {
  it('creates basic SQL expressions', () => {
    const expr = sql`1 + 1`;
    expect(String(expr)).toBe('1 + 1');
    expect(columns(expr)).toEqual([]);
    expect(params(expr)).toEqual([]);
  });

  it('creates interpolated SQL expressions', () => {
    const expr = sql`${column('foo')} * ${column('bar')}`;
    expect(String(expr)).toBe('"foo" * "bar"');
    expect(columns(expr)).toEqual(['foo', 'bar']);
    expect(params(expr)).toEqual([]);
  });

  it('creates nested SQL expressions', () => {
    const base = sql`${column('foo')} * 4`;
    const expr = sql`${base} + 1`;
    expect(String(expr)).toBe('"foo" * 4 + 1');
    expect(columns(expr)).toEqual(['foo']);
    expect(params(expr)).toEqual([]);
  });

  it('creates parameterized SQL expressions', () => {
    const param = stubParam(4);
    expect(isParamLike(param)).toBe(true);

    const expr = sql`${column('foo')} * ${param}`;
    expect(String(expr)).toBe('"foo" * 4');
    expect(isParamLike(expr)).toBe(false);
    expect(columns(expr)).toEqual(['foo']);
    expect(params(expr)).toEqual([param]);

    param.update(5);
    expect(String(expr)).toBe('"foo" * 5');
  });

  it('creates nested parameterized SQL expressions', () => {
    const param = stubParam(4);
    expect(isParamLike(param)).toBe(true);

    const base = sql`${column('foo')} * ${param}`;
    const expr = sql`${base} + 1`;
    expect(String(expr)).toBe('"foo" * 4 + 1');
    expect(isParamLike(expr)).toBe(false);
    expect(columns(expr)).toEqual(['foo']);
    expect(params(expr)).toEqual([param]);

    param.update(5);
    expect(String(expr)).toBe('"foo" * 5 + 1');
  });
});
