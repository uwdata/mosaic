import { expect, describe, it } from 'vitest';
import { columns } from './util/columns.js';
import { stubParam } from './util/stub-param.js';
import { asc, column, desc, isParamLike } from '../src/index.js';
import { validateQuery } from './util/validate.js';

/** Validate an ORDER BY fragment by wrapping it in a SELECT. */
async function validateOrderBy(expr: { toString(): string }, expected: string) {
  const query = `SELECT * FROM t1 ORDER BY ${expr}`;
  expect(query).toBe(`SELECT * FROM t1 ORDER BY ${expected}`);
  await validateQuery(query)
}

describe('asc', () => {
  it('specifies ascending order', async () => {
    const expr = asc('num1');
    expect(isParamLike(expr)).toBe(false);
    await validateOrderBy(expr, '"num1" ASC');
    expect(columns(expr)).toEqual(['num1']);

    const param = stubParam(column('num2'));
    const expr2 = asc(param);
    await validateOrderBy(expr2, '"num2" ASC');

    param.update(column('num3'));
    await validateOrderBy(expr2, '"num3" ASC')
  });

  it('specifies ascending order with nulls first', async () => {
    const expr = asc('num1', true);
    await validateOrderBy(expr, '"num1" ASC NULLS FIRST');
    expect(columns(expr)).toEqual(['num1']);
  });

  it('specifies ascending order with nulls last', async () => {
    const expr = asc('num1', false);
    await validateOrderBy(expr, '"num1" ASC NULLS LAST');
    expect(columns(expr)).toEqual(['num1']);
  });
});

describe('desc', () => {
  it('specifies descending order', async () => {
    const expr = desc('num1');
    expect(isParamLike(expr)).toBe(false);
    await validateOrderBy(expr, '"num1" DESC');
    expect(columns(expr)).toEqual(['num1']);

    const param = stubParam(column('num2'));
    const expr2 = desc(param);
    await validateOrderBy(expr2, '"num2" DESC');

    param.update(column('num3'));
    await validateOrderBy(expr2, '"num3" DESC');
  });

  it('specifies descending order with nulls first', async () => {
    const expr = desc('num1', true);
    await validateOrderBy(expr, '"num1" DESC NULLS FIRST');
    expect(columns(expr)).toEqual(['num1']);
  });

  it('specifies descending order with nulls last', async () => {
    const expr = desc('num1', false);
    await validateOrderBy(expr, '"num1" DESC NULLS LAST');
    expect(columns(expr)).toEqual(['num1']);
  });
});
