import { expect, describe, it } from 'vitest';
import { add, cast, column, int32, float32, float64 } from '../src/index.js';

describe('cast', () => {
  it('performs type casts', async () => {
    await expect(cast('num1', 'DOUBLE')).toBeValidExpr('("num1")::DOUBLE');
    expect(String(cast(column('num1'), 'DOUBLE'))).toBe('("num1")::DOUBLE');

    const expr = cast(add('num2', 'num3'), 'INTEGER');
    await expect(expr).toBeValidExpr('(("num2" + "num3"))::INTEGER');
  });

  describe('int32', () => {
    it('casts to 32-bit integer', async () => {
      await expect(int32('num1')).toBeValidExpr('("num1")::INTEGER');
      expect(String(int32(column('num1')))).toBe('("num1")::INTEGER');
    });
  });

  describe('float32', () => {
    it('casts to 32-bit floating point number', async () => {
      await expect(float32('num1')).toBeValidExpr('("num1")::FLOAT');
      expect(String(float32(column('num1')))).toBe('("num1")::FLOAT');
    });
  });

  describe('float64', () => {
    it('casts to 64-bit floating point number', async () => {
      await expect(float64('num1')).toBeValidExpr('("num1")::DOUBLE');
      expect(String(float64(column('num1')))).toBe('("num1")::DOUBLE');
    });
  });
});
