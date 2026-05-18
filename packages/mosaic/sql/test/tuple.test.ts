import { expect, describe, it } from 'vitest';
import { TupleNode, literal } from '../src/index.js';

describe('Tuple', () => {
  it('renders a parenthesized list of values', () => {
    const tuple = new TupleNode([literal(1), literal(2), literal(3)]);
    expect(String(tuple)).toBe('(1, 2, 3)');
  });
});
