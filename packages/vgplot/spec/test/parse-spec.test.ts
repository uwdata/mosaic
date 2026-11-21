import { describe, it, expect } from 'vitest';
import { parseSpec } from '../src/index.js';

describe('parseSpec', () => {
  it('wraps a top-level mark in a plot', () => {
    // @ts-expect-error Spec does not declare top-level marks
    const ast = parseSpec({ mark: 'frame' });
    expect(ast.toJSON()).toEqual({ plot: [{ mark: 'frame' }] });
  });

  it('rejects unknown selection types', () => {
    expect(() => parseSpec({
      // @ts-expect-error 'bad' is not a selection type
      params: { s: { select: 'bad' } },
      plot: [{ mark: 'frame' }]
    })).toThrow('Unrecognized param type: bad');
  });
});
