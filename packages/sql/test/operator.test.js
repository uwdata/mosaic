import { expect, describe, it } from 'vitest';
import {
  column, and, or, not,
  isNull, isNotNull,
  eq, neq, lt, gt, lte, gte,
  isDistinct, isNotDistinct,
  isBetween, isNotBetween
} from '../src/index.js';

describe('Logical operators', () => {
  it('include AND expressions', () => {
    expect(String(and())).toBe('');
    expect(String(and('foo'))).toBe('"foo"');
    expect(String(and(null, true))).toBe('TRUE');
    expect(String(and(true, true))).toBe('(TRUE AND TRUE)');
    expect(String(and(true, null, false))).toBe('(TRUE AND FALSE)');
    expect(and().op).toBe('AND');
    expect(and().children.length).toBe(0);
    expect(and('foo').children.length).toBe(1);
    expect(and(null, true).children.length).toBe(1);
    expect(and(true, true).children.length).toBe(2);
  });
  it('include OR expressions', () => {
    expect(String(or())).toBe('');
    expect(String(or('foo'))).toBe('"foo"');
    expect(String(or(null, true))).toBe('TRUE');
    expect(String(or(false, true))).toBe('(FALSE OR TRUE)');
    expect(String(or(false, null, false))).toBe('(FALSE OR FALSE)');
    expect(or().op).toBe('OR');
    expect(or().children.length).toBe(0);
    expect(or('foo').children.length).toBe(1);
    expect(or(null, true).children.length).toBe(1);
    expect(or(false, true).children.length).toBe(2);
  });
});

describe('Unary operators', () => {
  it('include NOT expressions', () => {
    expect(String(not(column('foo')))).toBe('(NOT "foo")');
    expect(String(not('foo'))).toBe('(NOT "foo")');
  });
  it('include IS NULL expressions', () => {
    expect(String(isNull(column('foo')))).toBe('("foo" IS NULL)');
    expect(String(isNull('foo'))).toBe('("foo" IS NULL)');
  });
  it('include IS NOT NULL expressions', () => {
    expect(String(isNotNull(column('foo')))).toBe('("foo" IS NOT NULL)');
    expect(String(isNotNull('foo'))).toBe('("foo" IS NOT NULL)');
  });
});

describe('Binary operators', () => {
  it('include equality comparisons', () => {
    expect(String(eq(column('foo'), 1))).toBe('("foo" = 1)');
    expect(String(eq('foo', 1))).toBe('("foo" = 1)');
  });
  it('include inequality comparisons', () => {
    expect(String(neq(column('foo'), 1))).toBe('("foo" <> 1)');
    expect(String(neq('foo', 1))).toBe('("foo" <> 1)');
  });
  it('include less than comparisons', () => {
    expect(String(lt(column('foo'), 1))).toBe('("foo" < 1)');
    expect(String(lt('foo', 1))).toBe('("foo" < 1)');
  });
  it('include less than or equal comparisons', () => {
    expect(String(lte(column('foo'), 1))).toBe('("foo" <= 1)');
    expect(String(lte('foo', 1))).toBe('("foo" <= 1)');
  });
  it('include greater than comparisons', () => {
    expect(String(gt(column('foo'), 1))).toBe('("foo" > 1)');
    expect(String(gt('foo', 1))).toBe('("foo" > 1)');
  });
  it('include greater than or equal comparisons', () => {
    expect(String(gte(column('foo'), 1))).toBe('("foo" >= 1)');
    expect(String(gte('foo', 1))).toBe('("foo" >= 1)');
  });
  it('include IS DISTINCT FROM comparisons', () => {
    expect(String(isDistinct(column('foo'), null))).toBe('("foo" IS DISTINCT FROM NULL)');
    expect(String(isDistinct('foo', null))).toBe('("foo" IS DISTINCT FROM NULL)');
  });
  it('include IS NOT DISTINCT FROM comparisons', () => {
    expect(String(isNotDistinct(column('foo'), null))).toBe('("foo" IS NOT DISTINCT FROM NULL)');
    expect(String(isNotDistinct('foo', null))).toBe('("foo" IS NOT DISTINCT FROM NULL)');
  });
});

describe('Range operators', () => {
  it('test within inclusive ranges', () => {
    expect(String(isBetween('a', null))).toBe('');
    expect(String(isBetween('a', [0, 1]))).toBe('("a" BETWEEN 0 AND 1)');
  });
  it('test within exclusive ranges', () => {
    expect(String(isBetween('a', null, true))).toBe('');
    expect(String(isBetween('a', [0, 1], true))).toBe('(0 <= "a" AND "a" < 1)');
  });
  it('test not within inclusive ranges', () => {
    expect(String(isNotBetween('a', null))).toBe('');
    expect(String(isNotBetween('a', [0, 1]))).toBe('("a" NOT BETWEEN 0 AND 1)');
  });
  it('test not within exclusive ranges', () => {
    expect(String(isNotBetween('a', null, true))).toBe('');
    expect(String(isNotBetween('a', [0, 1], true))).toBe('NOT (0 <= "a" AND "a" < 1)');
  });
});
