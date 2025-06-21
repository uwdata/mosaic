import { expect, describe, it } from 'vitest';
import { add, cast, column, int32, float32, float64 } from '../src/index.js';

describe('cast', () => {
  it('performs type casts', () => {
    expect(String(cast('foo', 'DOUBLE'))).toBe('("foo")::DOUBLE');
    expect(String(cast(column('foo'), 'DOUBLE'))).toBe('("foo")::DOUBLE');

    const expr = cast(add('bar', 'baz'), 'INTEGER');
    expect(String(expr)).toBe('(("bar" + "baz"))::INTEGER');
  });

  describe('int32', () => {
    it('casts to 32-bit integer', () => {
      expect(String(int32('foo'))).toBe('("foo")::INTEGER');
      expect(String(int32(column('foo')))).toBe('("foo")::INTEGER');
    });
  });

  describe('float32', () => {
    it('casts to 32-bit floating point number', () => {
      expect(String(float32('foo'))).toBe('("foo")::FLOAT');
      expect(String(float32(column('foo')))).toBe('("foo")::FLOAT');
    });
  });

  describe('float64', () => {
    it('casts to 64-bit floating point number', () => {
      expect(String(float64('foo'))).toBe('("foo")::DOUBLE');
      expect(String(float64(column('foo')))).toBe('("foo")::DOUBLE');
    });
  });
});
