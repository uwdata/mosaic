import { expect, describe, it } from 'vitest';
import { IntervalNode, days, hours, interval, microseconds, milliseconds, minutes, months, seconds, years } from '../src/index.js';

describe('Interval functions', () => {
  it('includes interval', () => {
    const expr = interval('CENTURY', 2);
    expect(expr instanceof IntervalNode).toBe(true);
    expect(String(expr)).toBe('INTERVAL 2 CENTURY');
  });
  it('includes years', () => {
    const expr = years(5);
    expect(expr instanceof IntervalNode).toBe(true);
    expect(String(expr)).toBe('INTERVAL 5 YEARS');
  });
  it('includes months', () => {
    const expr = months(5);
    expect(expr instanceof IntervalNode).toBe(true);
    expect(String(expr)).toBe('INTERVAL 5 MONTHS');
  });
  it('includes days', () => {
    const expr = days(5);
    expect(expr instanceof IntervalNode).toBe(true);
    expect(String(expr)).toBe('INTERVAL 5 DAYS');
  });
  it('includes hours', () => {
    const expr = hours(5);
    expect(expr instanceof IntervalNode).toBe(true);
    expect(String(expr)).toBe('INTERVAL 5 HOURS');
  });
  it('includes minutes', () => {
    const expr = minutes(5);
    expect(expr instanceof IntervalNode).toBe(true);
    expect(String(expr)).toBe('INTERVAL 5 MINUTES');
  });
  it('includes seconds', () => {
    const expr = seconds(5);
    expect(expr instanceof IntervalNode).toBe(true);
    expect(String(expr)).toBe('INTERVAL 5 SECONDS');
  });
  it('includes milliseconds', () => {
    const expr = milliseconds(5);
    expect(expr instanceof IntervalNode).toBe(true);
    expect(String(expr)).toBe('INTERVAL 5 MILLISECONDS');
  });
  it('includes microseconds', () => {
    const expr = microseconds(5);
    expect(expr instanceof IntervalNode).toBe(true);
    expect(String(expr)).toBe('INTERVAL 5 MICROSECONDS');
  });
});
