import { expect, describe, it } from 'vitest';
import { columns } from './util/columns.js';
import { stubParam } from './util/stub-param.js';
import { validateQuery } from './util/validate.js';
import { asc, column, desc, isParamLike } from '../src/index.js';

/** Validate an ORDER BY fragment by wrapping it in a SELECT. */
function validateOrderBy(expr: { toString(): string }) {
  return validateQuery(`SELECT * FROM t1 ORDER BY ${expr}`);
}

describe('asc', () => {
  it('specifies ascending order', async () => {
    const expr = asc('num1');
    expect(isParamLike(expr)).toBe(false);
    expect(String(expr)).toBe('"num1" ASC');
    expect(columns(expr)).toEqual(['num1']);
    await validateOrderBy(expr);

    const param = stubParam(column('num2'));
    const expr2 = asc(param);
    expect(String(expr2)).toBe('"num2" ASC');
    await validateOrderBy(expr2);

    param.update(column('num3'));
    expect(String(expr2)).toBe('"num3" ASC');
  });

  it('specifies ascending order with nulls first', async () => {
    const expr = asc('num1', true);
    expect(String(expr)).toBe('"num1" ASC NULLS FIRST');
    expect(columns(expr)).toEqual(['num1']);
    await validateOrderBy(expr);
  });

  it('specifies ascending order with nulls last', async () => {
    const expr = asc('num1', false);
    expect(String(expr)).toBe('"num1" ASC NULLS LAST');
    expect(columns(expr)).toEqual(['num1']);
    await validateOrderBy(expr);
  });
});

describe('desc', () => {
  it('specifies descending order', async () => {
    const expr = desc('num1');
    expect(isParamLike(expr)).toBe(false);
    expect(String(expr)).toBe('"num1" DESC');
    expect(columns(expr)).toEqual(['num1']);
    await validateOrderBy(expr);

    const param = stubParam(column('num2'));
    const expr2 = desc(param);
    expect(String(expr2)).toBe('"num2" DESC');
    await validateOrderBy(expr2);

    param.update(column('num3'));
    expect(String(expr2)).toBe('"num3" DESC');
  });

  it('specifies descending order with nulls first', async () => {
    const expr = desc('num1', true);
    expect(String(expr)).toBe('"num1" DESC NULLS FIRST');
    expect(columns(expr)).toEqual(['num1']);
    await validateOrderBy(expr);
  });

  it('specifies descending order with nulls last', async () => {
    const expr = desc('num1', false);
    expect(String(expr)).toBe('"num1" DESC NULLS LAST');
    expect(columns(expr)).toEqual(['num1']);
    await validateOrderBy(expr);
  });
});
