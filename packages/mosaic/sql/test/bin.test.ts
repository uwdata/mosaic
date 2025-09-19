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
      const log10 = scaleTransform<number>({ type: 'log', base: 10 })!;
      expect(`${binHistogram('foo', [1, 1000], { steps: 5 }, log10)}`)
        .toBe('(10 ** floor(log("foo")))');

      const log2 = scaleTransform<number>({ type: 'log', base: 2 })!;
      expect(`${binHistogram('foo', [1, 64], { steps: 10 }, log2)}`)
        .toBe('(2 ** floor((ln("foo") / ln(2))))');
    });

    it('handles degenerate span', () => {
      expect(`${binHistogram('foo', [1, 1])}`).toBe('"foo"');
      expect(`${binHistogram('foo', [1, 1], { offset: 1 })}`).toBe('(1 + "foo")');
    });
  });

  describe('binDate', () => {
    const years: [Date, Date] = [new Date(2010, 0, 1), new Date(2020, 0, 1)];
    const months: [Date, Date] = [new Date(2010, 0, 1), new Date(2012, 0, 1)];
    const days: [Date, Date] = [new Date(2010, 0, 1), new Date(2010, 0, 10)];

    it('supports explicit time intervals', () => {
      expect(`${binDate('foo', years, { interval: 'year', step: 2 })}`)
        .toBe('time_bucket(INTERVAL 2 year, "foo")');

      expect(`${binDate('foo', years, { interval: 'month', step: 6 })}`)
        .toBe('time_bucket(INTERVAL 6 month, "foo")');

      expect(`${binDate('foo', months, { interval: 'month', step: 1 })}`)
        .toBe('time_bucket(INTERVAL 1 month, "foo")');

      expect(`${binDate('foo', months, { interval: 'month', step: 3 })}`)
        .toBe('time_bucket(INTERVAL 3 month, "foo")');

      expect(`${binDate('foo', days, { interval: 'day', step: 2 })}`)
        .toBe('time_bucket(INTERVAL 2 day, "foo")');

      expect(`${binDate('foo', days, { interval: 'hour', step: 12 })}`)
        .toBe('time_bucket(INTERVAL 12 hour, "foo")');

      expect(`${binDate('foo', [10, 20], { interval: 'millisecond', step: 10 })}`)
        .toBe('time_bucket(INTERVAL 10 millisecond, "foo")');

      expect(`${binDate('foo', [0.1, 0.2], { interval: 'microsecond', step: 10 })}`)
        .toBe('time_bucket(INTERVAL 10 microsecond, "foo")');
    });

    it('infers time intervals with steps', () => {
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

      expect(`${binDate('foo', [10, 20], { steps: 10 })}`)
        .toBe('time_bucket(INTERVAL 1 millisecond, "foo")');

      expect(`${binDate('foo', [0.1, 0.2], { steps: 10 })}`)
        .toBe('time_bucket(INTERVAL 10 microsecond, "foo")');
    });

    it('infers time intervals', () => {
      expect(`${binDate('foo', years)}`)
        .toBe('time_bucket(INTERVAL 3 month, "foo")');

      expect(`${binDate('foo', months)}`)
        .toBe('time_bucket(INTERVAL 1 month, "foo")');

      expect(`${binDate('foo', days)}`)
        .toBe('time_bucket(INTERVAL 6 hour, "foo")');

      expect(`${binDate('foo', [1e7, 2e7])}`)
        .toBe('time_bucket(INTERVAL 5 minute, "foo")');

      expect(`${binDate('foo', [1e5, 2e5])}`)
        .toBe('time_bucket(INTERVAL 5 second, "foo")');

      expect(`${binDate('foo', [0, 100])}`)
        .toBe('time_bucket(INTERVAL 5 millisecond, "foo")');

      expect(`${binDate('foo', [0, 0.1])}`)
        .toBe('time_bucket(INTERVAL 5 microsecond, "foo")');
    });

    it('handles degenerate span', () => {
      expect(`${binDate('foo', [1, 1])}`)
        .toBe('time_bucket(INTERVAL 1 day, "foo")');
      expect(`${binDate('foo', [1, 1], { offset: 1 })}`)
        .toBe('(time_bucket(INTERVAL 1 day, "foo") + INTERVAL 1 day)');
    });
  });
});
