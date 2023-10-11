import assert from 'node:assert';
import {
  column, and, or, not,
  isNull, isNotNull,
  eq, neq, lt, gt, lte, gte,
  isDistinct, isNotDistinct,
  isBetween, isNotBetween
} from '../src/index.js';

describe('Logical operators', () => {
  it('include AND expressions', () => {
    assert.strictEqual(String(and()), '');
    assert.strictEqual(String(and('foo')), '"foo"');
    assert.strictEqual(String(and(null, true)), 'TRUE');
    assert.strictEqual(String(and(true, true)), '(TRUE AND TRUE)');
    assert.strictEqual(String(and(true, null, false)), '(TRUE AND FALSE)');
    assert.strictEqual(and().op, 'AND');
    assert.strictEqual(and().children.length, 0);
    assert.strictEqual(and('foo').children.length, 1);
    assert.strictEqual(and(null, true).children.length, 1);
    assert.strictEqual(and(true, true).children.length, 2);
  });
  it('include OR expressions', () => {
    assert.strictEqual(String(or()), '');
    assert.strictEqual(String(or('foo')), '"foo"');
    assert.strictEqual(String(or(null, true)), 'TRUE');
    assert.strictEqual(String(or(false, true)), '(FALSE OR TRUE)');
    assert.strictEqual(String(or(false, null, false)), '(FALSE OR FALSE)');
    assert.strictEqual(or().op, 'OR');
    assert.strictEqual(or().children.length, 0);
    assert.strictEqual(or('foo').children.length, 1);
    assert.strictEqual(or(null, true).children.length, 1);
    assert.strictEqual(or(false, true).children.length, 2);
  });
});

describe('Unary operators', () => {
  it('include NOT expressions', () => {
    assert.strictEqual(String(not(column('foo'))), '(NOT "foo")');
    assert.strictEqual(String(not('foo')), '(NOT "foo")');
  });
  it('include IS NULL expressions', () => {
    assert.strictEqual(String(isNull(column('foo'))), '("foo" IS NULL)');
    assert.strictEqual(String(isNull('foo')), '("foo" IS NULL)');
  });
  it('include IS NOT NULL expressions', () => {
    assert.strictEqual(String(isNotNull(column('foo'))), '("foo" IS NOT NULL)');
    assert.strictEqual(String(isNotNull('foo')), '("foo" IS NOT NULL)');
  });
});

describe('Binary operators', () => {
  it('include equality comparisons', () => {
    assert.strictEqual(String(eq(column('foo'), 1)), '("foo" = 1)');
    assert.strictEqual(String(eq('foo', 1)), '("foo" = 1)');
  });
  it('include inequality comparisons', () => {
    assert.strictEqual(String(neq(column('foo'), 1)), '("foo" <> 1)');
    assert.strictEqual(String(neq('foo', 1)), '("foo" <> 1)');
  });
  it('include less than comparisons', () => {
    assert.strictEqual(String(lt(column('foo'), 1)), '("foo" < 1)');
    assert.strictEqual(String(lt('foo', 1)), '("foo" < 1)');
  });
  it('include less than or equal comparisons', () => {
    assert.strictEqual(String(lte(column('foo'), 1)), '("foo" <= 1)');
    assert.strictEqual(String(lte('foo', 1)), '("foo" <= 1)');
  });
  it('include greater than comparisons', () => {
    assert.strictEqual(String(gt(column('foo'), 1)), '("foo" > 1)');
    assert.strictEqual(String(gt('foo', 1)), '("foo" > 1)');
  });
  it('include greater than or equal comparisons', () => {
    assert.strictEqual(String(gte(column('foo'), 1)), '("foo" >= 1)');
    assert.strictEqual(String(gte('foo', 1)), '("foo" >= 1)');
  });
  it('include IS DISTINCT FROM comparisons', () => {
    assert.strictEqual(String(isDistinct(column('foo'), null)), '("foo" IS DISTINCT FROM NULL)');
    assert.strictEqual(String(isDistinct('foo', null)), '("foo" IS DISTINCT FROM NULL)');
  });
  it('include IS NOT DISTINCT FROM comparisons', () => {
    assert.strictEqual(String(isNotDistinct(column('foo'), null)), '("foo" IS NOT DISTINCT FROM NULL)');
    assert.strictEqual(String(isNotDistinct('foo', null)), '("foo" IS NOT DISTINCT FROM NULL)');
  });
});

describe('Range operators', () => {
  it('test within inclusive ranges', () => {
    assert.strictEqual(String(isBetween('a', null)), '');
    assert.strictEqual(String(isBetween('a', [0, 1])), '("a" BETWEEN 0 AND 1)');
  });
  it('test within exclusive ranges', () => {
    assert.strictEqual(String(isBetween('a', null, true)), '');
    assert.strictEqual(String(isBetween('a', [0, 1], true)), '(0 <= "a" AND "a" < 1)');
  });
  it('test not within inclusive ranges', () => {
    assert.strictEqual(String(isNotBetween('a', null)), '');
    assert.strictEqual(String(isNotBetween('a', [0, 1])), '("a" NOT BETWEEN 0 AND 1)');
  });
  it('test not within exclusive ranges', () => {
    assert.strictEqual(String(isNotBetween('a', null, true)), '');
    assert.strictEqual(String(isNotBetween('a', [0, 1], true)), 'NOT (0 <= "a" AND "a" < 1)');
  });
});
