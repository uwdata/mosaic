import { expect, describe, it } from 'vitest';
import { binDate, binHistogram, scaleTransform } from '../src/index.js';

describe('Binning transforms', () => {
  describe('binHistogram', () => {
    it('creates linear bins', async () => {
      await expect(binHistogram('num1', [0, 100], { steps: 10 }))
        .toBeValidExpr('(10 * floor(("num1" / (10)::DOUBLE)))');

      await expect(binHistogram('num1', [0, 100], { step: 10 }))
        .toBeValidExpr('(10 * floor(("num1" / (10)::DOUBLE)))');

      await expect(binHistogram('num1', [0, 95], { step: 10 }))
        .toBeValidExpr('(10 * floor(("num1" / (10)::DOUBLE)))');

      await expect(binHistogram('num1', [50, 100], { step: 5 }))
        .toBeValidExpr('(50 + (5 * floor((("num1" - 50) / (5)::DOUBLE))))');

      await expect(binHistogram('num1', [0, 5], { steps: 10, minstep: 1 }))
        .toBeValidExpr('floor("num1")');
    });

    it('creates non-linear bins', async () => {
      const log10 = scaleTransform<number>({ type: 'log', base: 10 })!;
      await expect(binHistogram('num1', [1, 1000], { steps: 5 }, log10))
        .toBeValidExpr('(10 ** floor(log("num1")))');

      const log2 = scaleTransform<number>({ type: 'log', base: 2 })!;
      await expect(binHistogram('num1', [1, 64], { steps: 10 }, log2))
        .toBeValidExpr('(2 ** floor((ln("num1") / ln(2))))');
    });

    it('handles degenerate span', async () => {
      await expect(binHistogram('num1', [1, 1])).toBeValidExpr('floor("num1")');
      await expect(binHistogram('num1', [1, 1], { offset: 1 })).toBeValidExpr('(1 + floor("num1"))');
    });
  });

  describe('binDate', () => {
    const years: [Date, Date] = [new Date(2010, 0, 1), new Date(2020, 0, 1)];
    const months: [Date, Date] = [new Date(2010, 0, 1), new Date(2012, 0, 1)];
    const days: [Date, Date] = [new Date(2010, 0, 1), new Date(2010, 0, 10)];

    it('supports explicit time intervals', async () => {
      await expect(binDate('ts1', years, { interval: 'year', step: 2 }))
        .toBeValidExpr('time_bucket(INTERVAL 2 year, "ts1")');

      await expect(binDate('ts1', years, { interval: 'month', step: 6 }))
        .toBeValidExpr('time_bucket(INTERVAL 6 month, "ts1")');

      await expect(binDate('ts1', months, { interval: 'month', step: 1 }))
        .toBeValidExpr('time_bucket(INTERVAL 1 month, "ts1")');

      await expect(binDate('ts1', months, { interval: 'month', step: 3 }))
        .toBeValidExpr('time_bucket(INTERVAL 3 month, "ts1")');

      await expect(binDate('ts1', days, { interval: 'day', step: 2 }))
        .toBeValidExpr('time_bucket(INTERVAL 2 day, "ts1")');

      await expect(binDate('ts1', days, { interval: 'hour', step: 12 }))
        .toBeValidExpr('time_bucket(INTERVAL 12 hour, "ts1")');

      await expect(binDate('ts1', [10, 20], { interval: 'millisecond', step: 10 }))
        .toBeValidExpr('time_bucket(INTERVAL 10 millisecond, "ts1")');

      await expect(binDate('ts1', [0.1, 0.2], { interval: 'microsecond', step: 10 }))
        .toBeValidExpr('time_bucket(INTERVAL 10 microsecond, "ts1")');
    });

    it('infers time intervals with steps', async () => {
      await expect(binDate('ts1', years, { steps: 11 }))
        .toBeValidExpr('time_bucket(INTERVAL 1 year, "ts1")');

      await expect(binDate('ts1', years, { steps: 30 }))
        .toBeValidExpr('time_bucket(INTERVAL 3 month, "ts1")');

      await expect(binDate('ts1', months, { steps: 25 }))
        .toBeValidExpr('time_bucket(INTERVAL 1 month, "ts1")');

      await expect(binDate('ts1', months, { steps: 100 }))
        .toBeValidExpr('time_bucket(INTERVAL 7 day, "ts1")');

      await expect(binDate('ts1', days, { steps: 10 }))
        .toBeValidExpr('time_bucket(INTERVAL 1 day, "ts1")');

      await expect(binDate('ts1', days, { steps: 20 }))
        .toBeValidExpr('time_bucket(INTERVAL 12 hour, "ts1")');

      await expect(binDate('ts1', [10, 20], { steps: 10 }))
        .toBeValidExpr('time_bucket(INTERVAL 1 millisecond, "ts1")');

      await expect(binDate('ts1', [0.1, 0.2], { steps: 10 }))
        .toBeValidExpr('time_bucket(INTERVAL 10 microsecond, "ts1")');
    });

    it('infers time intervals', async () => {
      await expect(binDate('ts1', years))
        .toBeValidExpr('time_bucket(INTERVAL 3 month, "ts1")');

      await expect(binDate('ts1', months))
        .toBeValidExpr('time_bucket(INTERVAL 1 month, "ts1")');

      await expect(binDate('ts1', days))
        .toBeValidExpr('time_bucket(INTERVAL 6 hour, "ts1")');

      await expect(binDate('ts1', [1e7, 2e7]))
        .toBeValidExpr('time_bucket(INTERVAL 5 minute, "ts1")');

      await expect(binDate('ts1', [1e5, 2e5]))
        .toBeValidExpr('time_bucket(INTERVAL 5 second, "ts1")');

      await expect(binDate('ts1', [0, 100]))
        .toBeValidExpr('time_bucket(INTERVAL 5 millisecond, "ts1")');

      await expect(binDate('ts1', [0, 0.1]))
        .toBeValidExpr('time_bucket(INTERVAL 5 microsecond, "ts1")');
    });

    it('handles degenerate span', async () => {
      await expect(binDate('ts1', [1, 1]))
        .toBeValidExpr('time_bucket(INTERVAL 1 day, "ts1")');
      await expect(binDate('ts1', [1, 1], { offset: 1 }))
        .toBeValidExpr('(time_bucket(INTERVAL 1 day, "ts1") + INTERVAL 1 day)');
    });
  });
});
