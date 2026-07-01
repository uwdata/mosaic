import { expect, describe, it } from 'vitest';
import { scaleTransform } from '../src/index.js';

describe('scaleTransform', () => {
  it('symlog invert is the inverse of apply', () => {
    const s = scaleTransform<number>({ type: 'symlog' });
    for (const x of [5, 10, 100, -7, 1, 0.5]) {
      expect(s.invert(s.apply(x))).toBeCloseTo(x, 9);
    }
  });
});
