import { describe, it, expect } from 'vitest';
import { register, unregister } from 'timezone-mock';
import { formatDate } from '../src/util/format.js';

describe('formatDate', () => {
  it('formats ISO dates', () => {
    register('US/Eastern');
    expect(formatDate(new Date(2012, 0, 1))).toBe('2012-01-01T05:00Z');
    unregister();
  });

  it('formats invalid ISO dates', () => {
    expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
  });
});
