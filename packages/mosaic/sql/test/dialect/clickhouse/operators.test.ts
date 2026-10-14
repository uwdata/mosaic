import { expect, describe, it } from 'vitest';
import { bitAnd, bitLeft, bitNot, bitOr, bitRight, clickHouseCodeGenerator, idiv, literal, pow } from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse unary operator overrides', () => {
  it('rewrites bitwise NOT expressions', () => {
    expect(bitNot('foo').toString(gen)).toBe('bitNot("foo")');
  });
  it('throws on bitwise NOT of a non-integer literal', () => {
    expect(() => bitNot(literal('101011')).toString(gen)).toThrow(/got "101011"/);
    expect(() => bitNot(literal(1.5)).toString(gen)).toThrow(/got 1.5/);
  });
});

describe('ClickHouse binary operator overrides', () => {
  it('rewrites exponentiation operator', () => {
    expect(pow('foo', 2).toString(gen)).toBe('pow("foo", 2)');
  });
  it('rewrites integer division operator', () => {
    expect(idiv('foo', 2).toString(gen)).toBe('intDiv("foo", 2)');
  });
  it('rewrites bitwise AND operator', () => {
    expect(bitAnd('foo', 3).toString(gen)).toBe('bitAnd("foo", 3)');
  });
  it('rewrites bitwise OR operator', () => {
    expect(bitOr('foo', 3).toString(gen)).toBe('bitOr("foo", 3)');
  });
  it('rewrites bitwise left-shift operator', () => {
    expect(bitLeft('foo', 3).toString(gen)).toBe('bitShiftLeft("foo", 3)');
  });
  it('rewrites bitwise right-shift operator', () => {
    expect(bitRight('foo', 2).toString(gen)).toBe('bitShiftRight("foo", 2)');
  });
});
