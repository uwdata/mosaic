import { expect, describe, it } from 'vitest';
import { add, and, column, div, eq, gt, gte, idiv, InOpNode, isBetween, isDistinct, isIn, isInDistinct, isNotBetween, isNotDistinct, isNotNull, isNull, ListNode, literal, lt, lte, mod, mul, neq, not, or, pow, sub } from '../src/index.js';

describe('Logical operators', () => {
  it('include AND expressions', async () => {
    expect(String(and())).toBe('');
    await expect(and('flag1')).toBeValidExpr('"flag1"');
    await expect(and(null, true)).toBeValidExpr('TRUE');
    await expect(and(true, true)).toBeValidExpr('(TRUE AND TRUE)');
    await expect(and(true, null, false)).toBeValidExpr('(TRUE AND FALSE)');
    expect(and().op).toBe('AND');
    expect(and().clauses.length).toBe(0);
    expect(and('flag1').clauses.length).toBe(1);
    expect(and(null, true).clauses.length).toBe(1);
    expect(and(true, true).clauses.length).toBe(2);
  });
  it('include OR expressions', async () => {
    expect(String(or())).toBe('');
    await expect(or('flag1')).toBeValidExpr('"flag1"');
    expect(String(or(null, true))).toBe('TRUE');
    await expect(or(false, true)).toBeValidExpr('(FALSE OR TRUE)');
    await expect(or(false, null, false)).toBeValidExpr('(FALSE OR FALSE)');
    expect(or().op).toBe('OR');
    expect(or().clauses.length).toBe(0);
    expect(or('flag1').clauses.length).toBe(1);
    expect(or(null, true).clauses.length).toBe(1);
    expect(or(false, true).clauses.length).toBe(2);
  });
});

describe('Unary operators', () => {
  it('include NOT expressions', async () => {
    await expect(not(column('flag1'))).toBeValidExpr('(NOT "flag1")');
    expect(String(not('flag1'))).toBe('(NOT "flag1")');
  });
  it('include IS NULL expressions', async () => {
    await expect(isNull(column('num1'))).toBeValidExpr('("num1" IS NULL)');
    expect(String(isNull('num1'))).toBe('("num1" IS NULL)');
  });
  it('include IS NOT NULL expressions', async () => {
    await expect(isNotNull(column('num1'))).toBeValidExpr('("num1" IS NOT NULL)');
    expect(String(isNotNull('num1'))).toBe('("num1" IS NOT NULL)');
  });
});

describe('Binary operators', () => {
  it('include addition operator', async () => {
    expect(String(add(column('num1'), 1))).toBe('("num1" + 1)');
    await expect(add('num1', 1)).toBeValidExpr('("num1" + 1)');
  });
  it('include subtraction operator', async () => {
    expect(String(sub(column('num1'), 1))).toBe('("num1" - 1)');
    await expect(sub('num1', 1)).toBeValidExpr('("num1" - 1)');
  });
  it('include multiplication operator', async () => {
    expect(String(mul(column('num1'), 1))).toBe('("num1" * 1)');
    await expect(mul('num1', 1)).toBeValidExpr('("num1" * 1)');
  });
  it('include division operator', async () => {
    expect(String(div(column('num1'), 2))).toBe('("num1" / 2)');
    await expect(div('num1', 2)).toBeValidExpr('("num1" / 2)');
  });
  it('include integer division operator', async () => {
    expect(String(idiv(column('num1'), 2))).toBe('("num1" // 2)');
    await expect(idiv('num1', 2)).toBeValidExpr('("num1" // 2)');
  });
  it('include modulo operator', async () => {
    expect(String(mod(column('num1'), 2))).toBe('("num1" % 2)');
    await expect(mod('num1', 2)).toBeValidExpr('("num1" % 2)');
  });
  it('include exponentiation operator', async () => {
    expect(String(pow(column('num1'), 2))).toBe('("num1" ** 2)');
    await expect(pow('num1', 2)).toBeValidExpr('("num1" ** 2)');
  });
  it('include equality comparisons', async () => {
    expect(String(eq(column('num1'), 1))).toBe('("num1" = 1)');
    await expect(eq('num1', 1)).toBeValidExpr('("num1" = 1)');
  });
  it('include inequality comparisons', async () => {
    expect(String(neq(column('num1'), 1))).toBe('("num1" <> 1)');
    await expect(neq('num1', 1)).toBeValidExpr('("num1" <> 1)');
  });
  it('include less than comparisons', async () => {
    expect(String(lt(column('num1'), 1))).toBe('("num1" < 1)');
    await expect(lt('num1', 1)).toBeValidExpr('("num1" < 1)');
  });
  it('include less than or equal comparisons', async () => {
    expect(String(lte(column('num1'), 1))).toBe('("num1" <= 1)');
    await expect(lte('num1', 1)).toBeValidExpr('("num1" <= 1)');
  });
  it('include greater than comparisons', async () => {
    expect(String(gt(column('num1'), 1))).toBe('("num1" > 1)');
    await expect(gt('num1', 1)).toBeValidExpr('("num1" > 1)');
  });
  it('include greater than or equal comparisons', async () => {
    expect(String(gte(column('num1'), 1))).toBe('("num1" >= 1)');
    await expect(gte('num1', 1)).toBeValidExpr('("num1" >= 1)');
  });
  it('include IS DISTINCT FROM comparisons', async () => {
    expect(String(isDistinct(column('num1'), null))).toBe('("num1" IS DISTINCT FROM NULL)');
    await expect(isDistinct('num1', null)).toBeValidExpr('("num1" IS DISTINCT FROM NULL)');
  });
  it('include IS NOT DISTINCT FROM comparisons', async () => {
    expect(String(isNotDistinct(column('num1'), null))).toBe('("num1" IS NOT DISTINCT FROM NULL)');
    await expect(isNotDistinct('num1', null)).toBeValidExpr('("num1" IS NOT DISTINCT FROM NULL)');
  });
});

describe('Set inclusion operators', () => {
  it('include IN operator', async () => {
    const set = [literal('a'), literal('b'), literal('c')];
    await expect(isIn(column('txt1'), set)).toBeValidExpr(`("txt1" IN ('a', 'b', 'c'))`);
    expect(String(isIn('txt1', set))).toBe(`("txt1" IN ('a', 'b', 'c'))`);
  });
  it('include IN with list values', async () => {
    const values = new ListNode([literal('a'), literal('b'), literal('c')]);
    const test = new InOpNode(column("txt1"), values);
    await expect(test).toBeValidExpr(`("txt1" IN ['a', 'b', 'c'])`);
  });
  it('include null-safe IN test', async () => {
    const set = [literal('a'), literal('b'), literal('c')];
    await expect(isInDistinct(column('txt1'), set)).toBeValidExpr(`("txt1" IN ('a', 'b', 'c'))`);
    expect(String(isInDistinct('txt1', set))).toBe(`("txt1" IN ('a', 'b', 'c'))`);
    await expect(isInDistinct(column('txt1'), [...set, literal(null)])).toBeValidExpr(`(("txt1" IN ('a', 'b', 'c')) OR ("txt1" IS NULL))`);
    expect(String(isInDistinct('txt1', [...set, null]))).toBe(`(("txt1" IN ('a', 'b', 'c')) OR ("txt1" IS NULL))`);
    await expect(isInDistinct(column('txt1'), [literal(null)])).toBeValidExpr(`("txt1" IS NULL)`);
    expect(String(isInDistinct('txt1', [null]))).toBe(`("txt1" IS NULL)`);
  });
});

describe('Range operators', () => {
  it('include BETWEEN operator', async () => {
    expect(String(isBetween('num1', null))).toBe('');
    await expect(isBetween('num1', [0, 1])).toBeValidExpr('("num1" BETWEEN 0 AND 1)');
  });
  it('include NOT BETWEEN operator', async () => {
    expect(String(isNotBetween('num1', null))).toBe('');
    await expect(isNotBetween('num1', [0, 1])).toBeValidExpr('("num1" NOT BETWEEN 0 AND 1)');
  });
});
