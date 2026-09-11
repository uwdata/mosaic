import { describe, it, expect } from 'vitest';
import { toDataColumns } from '../src/index.js';

describe('toDataColumns', () => {
  it('extracts columns from an apache-arrow table', () => {
    const columns: Record<string, unknown[]> = { a: [1, 2], b: ['x', 'y'] };
    const children = Object.values(columns);
    const data = {
      numRows: 2,
      schema: { fields: Object.keys(columns).map(name => ({ name })) },
      getChild: () => null,
      getChildAt: (i: number) => ({ toArray: () => children[i] })
    };
    expect(toDataColumns(data)).toEqual({ numRows: 2, columns });
  });
});
