import { expect, describe, it } from 'vitest';
import { binDate, binHistogram, scaleTransform } from '../src/index.js';

describe('Binning transforms', () => {
  describe('binHistogram', () => {
    it('creates linear bins', () => {
      expect(`${binHistogram('foo', [0, 100], { steps: 10 })}`)
        .toBe('(10 * floor(("foo" / (10)::DOUBLE)))');

      expect(`${binHistogram('foo', [0, 100], { step: 10 })}`)
        .toBe('(10 * floor(("foo" / (10)::DOUBLE)))');

      expect(`${binHistogram('foo', [0, 95], { step: 10 })}`)
        .toBe('(10 * floor(("foo" / (10)::DOUBLE)))');

      expect(`${binHistogram('foo', [50, 100], { step: 5 })}`)
        .toBe('(50 + (5 * floor((("foo" - 50) / (5)::DOUBLE))))');

      expect(`${binHistogram('foo', [0, 5], { steps: 10, minstep: 1 })}`)
        .toBe('floor("foo")');
    });

    it('creates non-linear bins', () => {
      const log10 = scaleTransform({ type: 'log', base: 10 });
      expect(`${binHistogram('foo', [1, 1000], { steps: 5 }, log10)}`)
        .toBe('(10 ** floor(log("foo")))');

      const log2 = scaleTransform({ type: 'log', base: 2 });
      expect(`${binHistogram('foo', [1, 64], { steps: 10 }, log2)}`)
        .toBe('(2 ** floor((ln("foo") / ln(2))))');
    });
  });

  describe('binDate', () => {
    const years = [new Date(2010, 0, 1), new Date(2020, 0, 1)];
    const months = [new Date(2010, 0, 1), new Date(2012, 0, 1)];
    const days = [new Date(2010, 0, 1), new Date(2010, 0, 10)];

    it('accepts explicit time intervals', () => {
      expect(`${binDate('foo', years, { interval: { unit: 'year', step: 2 } })}`)
        .toBe('time_bucket(INTERVAL 2 year, "foo")');

      expect(`${binDate('foo', years, { interval: { unit: 'month', step: 6 } })}`)
        .toBe('time_bucket(INTERVAL 6 month, "foo")');

      expect(`${binDate('foo', months, { interval: { unit: 'month', step: 1 } })}`)
        .toBe('time_bucket(INTERVAL 1 month, "foo")');

      expect(`${binDate('foo', months, { interval: { unit: 'month', step: 3 } })}`)
        .toBe('time_bucket(INTERVAL 3 month, "foo")');

      expect(`${binDate('foo', days, { interval: { unit: 'day', step: 2 } })}`)
        .toBe('time_bucket(INTERVAL 2 day, "foo")');

      expect(`${binDate('foo', days, { interval: { unit: 'hour', step: 12 } })}`)
        .toBe('time_bucket(INTERVAL 12 hour, "foo")');
    });

    it('infers time intervals', () => {
      expect(`${binDate('foo', years, { steps: 11 })}`)
        .toBe('time_bucket(INTERVAL 1 year, "foo")');

      expect(`${binDate('foo', years, { steps: 30 })}`)
        .toBe('time_bucket(INTERVAL 3 month, "foo")');

      expect(`${binDate('foo', months, { steps: 25 })}`)
        .toBe('time_bucket(INTERVAL 1 month, "foo")');

      expect(`${binDate('foo', months, { steps: 100 })}`)
        .toBe('time_bucket(INTERVAL 7 day, "foo")');

      expect(`${binDate('foo', days, { steps: 10 })}`)
        .toBe('time_bucket(INTERVAL 1 day, "foo")');

      expect(`${binDate('foo', days, { steps: 20 })}`)
        .toBe('time_bucket(INTERVAL 12 hour, "foo")');
    });
  });
});
