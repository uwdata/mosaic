import { expect, describe, it } from 'vitest';
import { binDate, binHistogram, scaleTransform } from '../src/index.js';

describe('Binning transforms', () => {
  describe('binHistogram', () => {
    it('creates linear bins', async () => {
      await expect(binHistogram('foo', [0, 100], { steps: 10 }))
        .toBeValidExpr('(10 * floor(("foo" / (10)::DOUBLE)))');

      expect(`${binHistogram('foo', [0, 100], { step: 10 })}`)
        .toBe('(10 * floor(("foo" / (10)::DOUBLE)))');

      expect(`${binHistogram('foo', [0, 95], { step: 10 })}`)
        .toBe('(10 * floor(("foo" / (10)::DOUBLE)))');

      await expect(binHistogram('foo', [50, 100], { step: 5 }))
        .toBeValidExpr('(50 + (5 * floor((("foo" - 50) / (5)::DOUBLE))))');

      await expect(binHistogram('foo', [0, 5], { steps: 10, minstep: 1 }))
        .toBeValidExpr('floor("foo")');
    });

    it('creates non-linear bins', async () => {
      const log10 = scaleTransform<number>({ type: 'log', base: 10 })!;
      await expect(binHistogram('foo', [1, 1000], { steps: 5 }, log10))
        .toBeValidExpr('(10 ** floor(log("foo")))');

      const log2 = scaleTransform<number>({ type: 'log', base: 2 })!;
      await expect(binHistogram('foo', [1, 64], { steps: 10 }, log2))
        .toBeValidExpr('(2 ** floor((ln("foo") / ln(2))))');
    });

    it('handles degenerate span', async () => {
      await expect(binHistogram('foo', [1, 1])).toBeValidExpr('floor("foo")');
      await expect(binHistogram('foo', [1, 1], { offset: 1 })).toBeValidExpr('(1 + floor("foo"))');
    });
  });

  describe('binDate', () => {
    const years: [Date, Date] = [new Date(2010, 0, 1), new Date(2020, 0, 1)];
    const months: [Date, Date] = [new Date(2010, 0, 1), new Date(2012, 0, 1)];
    const days: [Date, Date] = [new Date(2010, 0, 1), new Date(2010, 0, 10)];

    it('supports explicit time intervals', async () => {
      await expect(binDate('foo', years, { interval: 'year', step: 2 }))
        .toBeValidExpr('time_bucket(INTERVAL 2 year, "foo")', 'dates');

      await expect(binDate('foo', years, { interval: 'month', step: 6 }))
        .toBeValidExpr('time_bucket(INTERVAL 6 month, "foo")', 'dates');

      expect(`${binDate('foo', months, { interval: 'month', step: 1 })}`)
        .toBe('time_bucket(INTERVAL 1 month, "foo")');

      expect(`${binDate('foo', months, { interval: 'month', step: 3 })}`)
        .toBe('time_bucket(INTERVAL 3 month, "foo")');

      await expect(binDate('foo', days, { interval: 'day', step: 2 }))
        .toBeValidExpr('time_bucket(INTERVAL 2 day, "foo")', 'dates');

      expect(`${binDate('foo', days, { interval: 'hour', step: 12 })}`)
        .toBe('time_bucket(INTERVAL 12 hour, "foo")');

      await expect(binDate('foo', [10, 20], { interval: 'millisecond', step: 10 }))
        .toBeValidExpr('time_bucket(INTERVAL 10 millisecond, "foo")', 'dates');

      await expect(binDate('foo', [0.1, 0.2], { interval: 'microsecond', step: 10 }))
        .toBeValidExpr('time_bucket(INTERVAL 10 microsecond, "foo")', 'dates');
    });

    it('infers time intervals with steps', async () => {
      await expect(binDate('foo', years, { steps: 11 }))
        .toBeValidExpr('time_bucket(INTERVAL 1 year, "foo")', 'dates');

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

      await expect(binDate('foo', [0.1, 0.2], { steps: 10 }))
        .toBeValidExpr('time_bucket(INTERVAL 10 microsecond, "foo")', 'dates');
    });

    it('infers time intervals', async () => {
      await expect(binDate('foo', years))
        .toBeValidExpr('time_bucket(INTERVAL 3 month, "foo")', 'dates');

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

      await expect(binDate('foo', [0, 0.1]))
        .toBeValidExpr('time_bucket(INTERVAL 5 microsecond, "foo")', 'dates');
    });

    it('handles degenerate span', async () => {
      await expect(binDate('foo', [1, 1]))
        .toBeValidExpr('time_bucket(INTERVAL 1 day, "foo")', 'dates');
      await expect(binDate('foo', [1, 1], { offset: 1 }))
        .toBeValidExpr('(time_bucket(INTERVAL 1 day, "foo") + INTERVAL 1 day)', 'dates');
    });
  });
});
