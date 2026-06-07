import { expect, describe, it } from 'vitest';
import { add, and, column, div, eq, gt, gte, idiv, InOpNode, isBetween, isDistinct, isIn, isInDistinct, isNotBetween, isNotDistinct, isNotNull, isNull, ListNode, literal, lt, lte, mod, mul, neq, not, or, pow, sub } from '../src/index.js';

describe('Logical operators', () => {
  it('include AND expressions', async () => {
    expect(String(and())).toBe('');
    await expect(and('foo')).toBeValidExpr('"foo"', 'booleans');
    await expect(and(null, true)).toBeValidExpr('TRUE');
    await expect(and(true, true)).toBeValidExpr('(TRUE AND TRUE)');
    await expect(and(true, null, false)).toBeValidExpr('(TRUE AND FALSE)');
    expect(and().op).toBe('AND');
    expect(and().clauses.length).toBe(0);
    expect(and('foo').clauses.length).toBe(1);
    expect(and(null, true).clauses.length).toBe(1);
    expect(and(true, true).clauses.length).toBe(2);
  });
  it('include OR expressions', async () => {
    expect(String(or())).toBe('');
    await expect(or('foo')).toBeValidExpr('"foo"', 'booleans');
    expect(String(or(null, true))).toBe('TRUE');
    await expect(or(false, true)).toBeValidExpr('(FALSE OR TRUE)');
    await expect(or(false, null, false)).toBeValidExpr('(FALSE OR FALSE)');
    expect(or().op).toBe('OR');
    expect(or().clauses.length).toBe(0);
    expect(or('foo').clauses.length).toBe(1);
    expect(or(null, true).clauses.length).toBe(1);
    expect(or(false, true).clauses.length).toBe(2);
  });
});

describe('Unary operators', () => {
  it('include NOT expressions', async () => {
    await expect(not(column('foo'))).toBeValidExpr('(NOT "foo")', 'booleans');
    expect(String(not('foo'))).toBe('(NOT "foo")');
  });
  it('include IS NULL expressions', async () => {
    await expect(isNull(column('foo'))).toBeValidExpr('("foo" IS NULL)');
    expect(String(isNull('foo'))).toBe('("foo" IS NULL)');
  });
  it('include IS NOT NULL expressions', async () => {
    await expect(isNotNull(column('foo'))).toBeValidExpr('("foo" IS NOT NULL)');
    expect(String(isNotNull('foo'))).toBe('("foo" IS NOT NULL)');
  });
});

describe('Binary operators', () => {
  it('include addition operator', async () => {
    expect(String(add(column('foo'), 1))).toBe('("foo" + 1)');
    await expect(add('foo', 1)).toBeValidExpr('("foo" + 1)');
  });
  it('include subtraction operator', async () => {
    expect(String(sub(column('foo'), 1))).toBe('("foo" - 1)');
    await expect(sub('foo', 1)).toBeValidExpr('("foo" - 1)');
  });
  it('include multiplication operator', async () => {
    expect(String(mul(column('foo'), 1))).toBe('("foo" * 1)');
    await expect(mul('foo', 1)).toBeValidExpr('("foo" * 1)');
  });
  it('include division operator', async () => {
    expect(String(div(column('foo'), 2))).toBe('("foo" / 2)');
    await expect(div('foo', 2)).toBeValidExpr('("foo" / 2)');
  });
  it('include integer division operator', async () => {
    expect(String(idiv(column('foo'), 2))).toBe('("foo" // 2)');
    await expect(idiv('foo', 2)).toBeValidExpr('("foo" // 2)');
  });
  it('include modulo operator', async () => {
    expect(String(mod(column('foo'), 2))).toBe('("foo" % 2)');
    await expect(mod('foo', 2)).toBeValidExpr('("foo" % 2)');
  });
  it('include exponentiation operator', async () => {
    expect(String(pow(column('foo'), 2))).toBe('("foo" ** 2)');
    await expect(pow('foo', 2)).toBeValidExpr('("foo" ** 2)');
  });
  it('include equality comparisons', async () => {
    expect(String(eq(column('foo'), 1))).toBe('("foo" = 1)');
    await expect(eq('foo', 1)).toBeValidExpr('("foo" = 1)');
  });
  it('include inequality comparisons', async () => {
    expect(String(neq(column('foo'), 1))).toBe('("foo" <> 1)');
    await expect(neq('foo', 1)).toBeValidExpr('("foo" <> 1)');
  });
  it('include less than comparisons', async () => {
    expect(String(lt(column('foo'), 1))).toBe('("foo" < 1)');
    await expect(lt('foo', 1)).toBeValidExpr('("foo" < 1)');
  });
  it('include less than or equal comparisons', async () => {
    expect(String(lte(column('foo'), 1))).toBe('("foo" <= 1)');
    await expect(lte('foo', 1)).toBeValidExpr('("foo" <= 1)');
  });
  it('include greater than comparisons', async () => {
    expect(String(gt(column('foo'), 1))).toBe('("foo" > 1)');
    await expect(gt('foo', 1)).toBeValidExpr('("foo" > 1)');
  });
  it('include greater than or equal comparisons', async () => {
    expect(String(gte(column('foo'), 1))).toBe('("foo" >= 1)');
    await expect(gte('foo', 1)).toBeValidExpr('("foo" >= 1)');
  });
  it('include IS DISTINCT FROM comparisons', async () => {
    expect(String(isDistinct(column('foo'), null))).toBe('("foo" IS DISTINCT FROM NULL)');
    await expect(isDistinct('foo', null)).toBeValidExpr('("foo" IS DISTINCT FROM NULL)');
  });
  it('include IS NOT DISTINCT FROM comparisons', async () => {
    expect(String(isNotDistinct(column('foo'), null))).toBe('("foo" IS NOT DISTINCT FROM NULL)');
    await expect(isNotDistinct('foo', null)).toBeValidExpr('("foo" IS NOT DISTINCT FROM NULL)');
  });
});

describe('Set inclusion operators', () => {
  it('include IN operator', async () => {
    const set = [literal('a'), literal('b'), literal('c')];
    await expect(isIn(column('foo'), set)).toBeValidExpr(`("foo" IN ('a', 'b', 'c'))`, 'strings');
    expect(String(isIn('foo', set))).toBe(`("foo" IN ('a', 'b', 'c'))`);
  });
  it('include IN with list values', async () => {
    const values = new ListNode([literal('a'), literal('b'), literal('c')]);
    const test = new InOpNode(column("foo"), values);
    await expect(test).toBeValidExpr(`("foo" IN ['a', 'b', 'c'])`, 'strings');
  });
  it('include null-safe IN test', async () => {
    const set = [literal('a'), literal('b'), literal('c')];
    await expect(isInDistinct(column('foo'), set)).toBeValidExpr(`("foo" IN ('a', 'b', 'c'))`, 'strings');
    expect(String(isInDistinct('foo', set))).toBe(`("foo" IN ('a', 'b', 'c'))`);
    await expect(isInDistinct(column('foo'), [...set, literal(null)])).toBeValidExpr(`(("foo" IN ('a', 'b', 'c')) OR ("foo" IS NULL))`, 'strings');
    expect(String(isInDistinct('foo', [...set, null]))).toBe(`(("foo" IN ('a', 'b', 'c')) OR ("foo" IS NULL))`);
    await expect(isInDistinct(column('foo'), [literal(null)])).toBeValidExpr(`("foo" IS NULL)`);
    expect(String(isInDistinct('foo', [null]))).toBe(`("foo" IS NULL)`);
  });
});

describe('Range operators', () => {
  it('include BETWEEN operator', async () => {
    expect(String(isBetween('a', null))).toBe('');
    await expect(isBetween('a', [0, 1])).toBeValidExpr('("a" BETWEEN 0 AND 1)');
  });
  it('include NOT BETWEEN operator', async () => {
    expect(String(isNotBetween('a', null))).toBe('');
    await expect(isNotBetween('a', [0, 1])).toBeValidExpr('("a" NOT BETWEEN 0 AND 1)');
  });
});
