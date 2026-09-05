import { expect, describe, it } from 'vitest';
import { clickHouseCodeGenerator, column, isFinite, isInfinite, isNaN, log } from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse numeric-predicate overrides', () => {
  it('rewrites isnan', () => {
    expect(isNaN(column('x')).toString(gen)).toBe('isNaN("x")');
  });

  it('rewrites isinf', () => {
    expect(isInfinite(column('x')).toString(gen)).toBe('isInfinite("x")');
  });

  it('rewrites isfinite', () => {
    expect(isFinite(column('x')).toString(gen)).toBe('isFinite("x")');
  });

  it('rewrites base-10 logarithms', () => {
    expect(log(column('x')).toString(gen)).toBe('log10("x")');
  });
});
