import { expect, describe, it } from 'vitest';
import { stubParam } from './stub-param.js';
import { column, desc, isSQLExpression, isParamLike } from '../src/index.js';

describe('desc', () => {
  it('creates descending order annotations', () => {
    const expr = desc('foo');
    expect(isSQLExpression(expr)).toBe(true);
    expect(isParamLike(expr)).toBe(false);
    expect(String(expr)).toBe('"foo" DESC NULLS LAST');
    expect(expr.column).toBe('foo');
    expect(expr.columns).toEqual(['foo']);

    const param = stubParam(column('bar'));
    const expr2 = desc(param);
    expect(isSQLExpression(expr2)).toBe(true);
    expect(isParamLike(expr2)).toBe(true);
    expect(String(expr2)).toBe('"bar" DESC NULLS LAST');

    expr2.addEventListener('value', value => {
      expect(isSQLExpression(value)).toBe(true);
      expect(String(expr2)).toBe(`${value}`);
    });
    param.update(column('baz'));
    expect(String(expr2)).toBe('"baz" DESC NULLS LAST');
  });
});
