import { expect, describe, it } from 'vitest';
import { add, cast, column, int32, float32, float64 } from '../src/index.js';

describe('cast', () => {
  it('performs type casts', async () => {
    await expect(cast('foo', 'DOUBLE')).toBeValidExpr('("foo")::DOUBLE');
    expect(String(cast(column('foo'), 'DOUBLE'))).toBe('("foo")::DOUBLE');

    const expr = cast(add('bar', 'baz'), 'INTEGER');
    await expect(expr).toBeValidExpr('(("bar" + "baz"))::INTEGER');
  });

  describe('int32', () => {
    it('casts to 32-bit integer', async () => {
      await expect(int32('foo')).toBeValidExpr('("foo")::INTEGER');
      expect(String(int32(column('foo')))).toBe('("foo")::INTEGER');
    });
  });

  describe('float32', () => {
    it('casts to 32-bit floating point number', async () => {
      await expect(float32('foo')).toBeValidExpr('("foo")::FLOAT');
      expect(String(float32(column('foo')))).toBe('("foo")::FLOAT');
    });
  });

  describe('float64', () => {
    it('casts to 64-bit floating point number', async () => {
      await expect(float64('foo')).toBeValidExpr('("foo")::DOUBLE');
      expect(String(float64(column('foo')))).toBe('("foo")::DOUBLE');
    });
  });
});
