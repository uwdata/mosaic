import { expect, describe, it } from 'vitest';
import { literal } from '../src/index.js';

describe('literal', () => {
  it('handles nulls', () => {
    expect(`${literal(null)}`).toBe(`NULL`);
    expect(`${literal(undefined)}`).toBe(`NULL`);
  });

  it('handles strings', () => {
    expect(`${literal('foo')}`).toBe(`'foo'`);
  });

  it('handles numbers', () => {
    expect(`${literal(-0)}`).toBe(`0`);
    expect(`${literal(1.2)}`).toBe(`1.2`);
    expect(`${literal(1e-5)}`).toBe(`0.00001`);
    expect(`${literal(1e-9)}`).toBe(`1e-9`);
    expect(`${literal(NaN)}`).toBe(`NULL`);
  });

  it('handles bigints', () => {
    expect(`${literal(1n)}`).toBe(`1`);
    expect(`${literal(12345678901234567890n)}`).toBe(`12345678901234567890`);
  });

  it('handles booleans', () => {
    expect(`${literal(true)}`).toBe(`TRUE`);
    expect(`${literal(false)}`).toBe(`FALSE`);
  });

  it('handles dates and timestamps', () => {
    const d = new Date(2010, 2, 3, 4, 5, 6);
    expect(`${literal(d)}`).toBe(`epoch_ms(${+d})`);
    expect(`${literal(new Date(Date.UTC(2000, 0, 1)))}`).toBe(`DATE '2000-01-01'`);
    expect(`${literal(new Date(NaN))}`).toBe(`NULL`);
  });

  it('handles regular expressions', () => {
    expect(`${literal(/\w+/)}`).toBe(`'\\w+'`);
  });
});
