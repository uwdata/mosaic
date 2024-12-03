import { expect, describe, it } from 'vitest';
import { stubParam } from './stub-param.js';
import { column, isSQLExpression, isParamLike, sql } from '../src/index.js';

describe('sql template tag', () => {
  it('creates basic SQL expressions', () => {
    const expr = sql`1 + 1`;
    expect(isSQLExpression(expr)).toBe(true);
    expect(isParamLike(expr)).toBe(false);
    expect(String(expr)).toBe('1 + 1');
    expect(expr.column).toBeUndefined();
    expect(expr.columns).toEqual([]);
  });

  it('creates interpolated SQL expressions', () => {
    const expr = sql`${column('foo')} * ${column('bar')}`;
    expect(isSQLExpression(expr)).toBe(true);
    expect(isParamLike(expr)).toBe(false);
    expect(String(expr)).toBe('"foo" * "bar"');
    expect(expr.column).toBe('foo');
    expect(expr.columns).toEqual(['foo', 'bar']);
  });

  it('creates nested SQL expressions', () => {
    const base = sql`${column('foo')} * 4`;
    const expr = sql`${base} + 1`;
    expect(isSQLExpression(expr)).toBe(true);
    expect(String(expr)).toBe('"foo" * 4 + 1');
    expect(isParamLike(expr)).toBe(false);
    expect(expr.column).toBe('foo');
    expect(expr.columns).toEqual(['foo']);
  });

  it('creates parameterized SQL expressions', () => {
    const param = stubParam(4);
    expect(isParamLike(param)).toBe(true);

    const expr = sql`${column('foo')} * ${param}`;
    expect(isSQLExpression(expr)).toBe(true);
    expect(String(expr)).toBe('"foo" * 4');
    expect(isParamLike(expr)).toBe(true);
    expect(expr.column).toBe('foo');
    expect(expr.columns).toEqual(['foo']);

    expr.addEventListener('value', value => {
      expect(isSQLExpression(value)).toBe(true);
      expect(String(expr)).toBe(`${value}`);
    });
    param.update(5);
    expect(String(expr)).toBe('"foo" * 5');
  });

  it('creates nested parameterized SQL expressions', () => {
    const param = stubParam(4);
    expect(isParamLike(param)).toBe(true);

    const base = sql`${column('foo')} * ${param}`;
    const expr = sql`${base} + 1`;
    expect(isSQLExpression(expr)).toBe(true);
    expect(String(expr)).toBe('"foo" * 4 + 1');
    expect(isParamLike(expr)).toBe(true);
    expect(expr.column).toBe('foo');
    expect(expr.columns).toEqual(['foo']);

    expr.addEventListener('value', value => {
      expect(isSQLExpression(value)).toBe(true);
      expect(String(expr)).toBe(`${value}`);
    });
    param.update(5);
    expect(String(expr)).toBe('"foo" * 5 + 1');
  });
});
