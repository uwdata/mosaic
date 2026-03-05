import { expect, describe, it } from 'vitest';
import { columns } from './util/columns.js';
import { stubParam } from './util/stub-param.js';
import { asc, column, desc, isParamLike } from '../src/index.js';

describe('asc', () => {
  it('specifies ascending order', () => {
    const expr = asc('foo');
    expect(isParamLike(expr)).toBe(false);
    expect(String(expr)).toBe('"foo" ASC');
    expect(columns(expr)).toEqual(['foo']);

    const param = stubParam(column('bar'));
    const expr2 = asc(param);
    expect(String(expr2)).toBe('"bar" ASC');

    param.update(column('baz'));
    expect(String(expr2)).toBe('"baz" ASC');
  });

  it('specifies ascending order with nulls first', () => {
    const expr = asc('foo', true);
    expect(String(expr)).toBe('"foo" ASC NULLS FIRST');
    expect(columns(expr)).toEqual(['foo']);
  });

  it('specifies ascending order with nulls last', () => {
    const expr = asc('foo', false);
    expect(String(expr)).toBe('"foo" ASC NULLS LAST');
    expect(columns(expr)).toEqual(['foo']);
  });
});

describe('desc', () => {
  it('specifies descending order', () => {
    const expr = desc('foo');
    expect(isParamLike(expr)).toBe(false);
    expect(String(expr)).toBe('"foo" DESC');
    expect(columns(expr)).toEqual(['foo']);

    const param = stubParam(column('bar'));
    const expr2 = desc(param);
    expect(String(expr2)).toBe('"bar" DESC');

    param.update(column('baz'));
    expect(String(expr2)).toBe('"baz" DESC');
  });

  it('specifies descending order with nulls first', () => {
    const expr = desc('foo', true);
    expect(String(expr)).toBe('"foo" DESC NULLS FIRST');
    expect(columns(expr)).toEqual(['foo']);
  });

  it('specifies descending order with nulls last', () => {
    const expr = desc('foo', false);
    expect(String(expr)).toBe('"foo" DESC NULLS LAST');
    expect(columns(expr)).toEqual(['foo']);
  });
});
