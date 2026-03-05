import { expect, describe, it } from 'vitest';
import { closeTo } from '../src/interactors/util/close-to.js';

describe('closeTo', () => {
  it('tests if two ranges are nearly identical', () => {
    expect(closeTo([0, 1], [0, 1])).toBe(true);
    expect(closeTo([0, 1], [1e-14, 1 - 1e-14])).toBe(true);
    expect(closeTo(null, null)).toBe(true);
    expect(closeTo(undefined, undefined)).toBe(true);
    expect(closeTo([0, 1], [1, 2])).toBe(false);
    expect(closeTo(null, [0, 1])).toBe(false);
    expect(closeTo([0, 1], null)).toBe(false);
  });
});
