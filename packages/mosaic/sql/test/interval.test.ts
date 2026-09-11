import { expect, describe, it } from 'vitest';
import { IntervalNode, days, hours, interval, microseconds, milliseconds, minutes, months, seconds, years } from '../src/index.js';

describe('Interval functions', () => {
  it('includes interval', async () => {
    const expr = interval('CENTURY', 2);
    expect(expr instanceof IntervalNode).toBe(true);
    await expect(expr).toBeValidExpr('INTERVAL 2 CENTURY');
  });
  it('includes years', async () => {
    const expr = years(5);
    expect(expr instanceof IntervalNode).toBe(true);
    await expect(expr).toBeValidExpr('INTERVAL 5 YEARS');
  });
  it('includes months', async () => {
    const expr = months(5);
    expect(expr instanceof IntervalNode).toBe(true);
    await expect(expr).toBeValidExpr('INTERVAL 5 MONTHS');
  });
  it('includes days', async () => {
    const expr = days(5);
    expect(expr instanceof IntervalNode).toBe(true);
    await expect(expr).toBeValidExpr('INTERVAL 5 DAYS');
  });
  it('includes hours', async () => {
    const expr = hours(5);
    expect(expr instanceof IntervalNode).toBe(true);
    await expect(expr).toBeValidExpr('INTERVAL 5 HOURS');
  });
  it('includes minutes', async () => {
    const expr = minutes(5);
    expect(expr instanceof IntervalNode).toBe(true);
    await expect(expr).toBeValidExpr('INTERVAL 5 MINUTES');
  });
  it('includes seconds', async () => {
    const expr = seconds(5);
    expect(expr instanceof IntervalNode).toBe(true);
    await expect(expr).toBeValidExpr('INTERVAL 5 SECONDS');
  });
  it('includes milliseconds', async () => {
    const expr = milliseconds(5);
    expect(expr instanceof IntervalNode).toBe(true);
    await expect(expr).toBeValidExpr('INTERVAL 5 MILLISECONDS');
  });
  it('includes microseconds', async () => {
    const expr = microseconds(5);
    expect(expr instanceof IntervalNode).toBe(true);
    await expect(expr).toBeValidExpr('INTERVAL 5 MICROSECONDS');
  });
});
