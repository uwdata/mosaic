import { expect, describe, it } from 'vitest';
import { columns } from './util/columns.js';
import { stubParam } from './util/stub-param.js';
import { validateQuery } from './util/validate.js';
import { asc, column, desc, isParamLike } from '../src/index.js';

/** Validate an ORDER BY fragment by wrapping it in a SELECT. */
function validateOrderBy(expr: { toString(): string }) {
  return validateQuery(`SELECT * FROM "numerics" ORDER BY ${expr}`);
}

describe('asc', () => {
  it('specifies ascending order', async () => {
    const expr = asc('foo');
    expect(isParamLike(expr)).toBe(false);
    expect(String(expr)).toBe('"foo" ASC');
    expect(columns(expr)).toEqual(['foo']);
    await validateOrderBy(expr);

    const param = stubParam(column('bar'));
    const expr2 = asc(param);
    expect(String(expr2)).toBe('"bar" ASC');
    await validateOrderBy(expr2);

    param.update(column('baz'));
    expect(String(expr2)).toBe('"baz" ASC');
  });

  it('specifies ascending order with nulls first', async () => {
    const expr = asc('foo', true);
    expect(String(expr)).toBe('"foo" ASC NULLS FIRST');
    expect(columns(expr)).toEqual(['foo']);
    await validateOrderBy(expr);
  });

  it('specifies ascending order with nulls last', async () => {
    const expr = asc('foo', false);
    expect(String(expr)).toBe('"foo" ASC NULLS LAST');
    expect(columns(expr)).toEqual(['foo']);
    await validateOrderBy(expr);
  });
});

describe('desc', () => {
  it('specifies descending order', async () => {
    const expr = desc('foo');
    expect(isParamLike(expr)).toBe(false);
    expect(String(expr)).toBe('"foo" DESC');
    expect(columns(expr)).toEqual(['foo']);
    await validateOrderBy(expr);

    const param = stubParam(column('bar'));
    const expr2 = desc(param);
    expect(String(expr2)).toBe('"bar" DESC');
    await validateOrderBy(expr2);

    param.update(column('baz'));
    expect(String(expr2)).toBe('"baz" DESC');
  });

  it('specifies descending order with nulls first', async () => {
    const expr = desc('foo', true);
    expect(String(expr)).toBe('"foo" DESC NULLS FIRST');
    expect(columns(expr)).toEqual(['foo']);
    await validateOrderBy(expr);
  });

  it('specifies descending order with nulls last', async () => {
    const expr = desc('foo', false);
    expect(String(expr)).toBe('"foo" DESC NULLS LAST');
    expect(columns(expr)).toEqual(['foo']);
    await validateOrderBy(expr);
  });
});
