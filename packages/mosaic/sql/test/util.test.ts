import { expect, describe, it } from 'vitest';
import { nullif } from '../src/index.js';
import { columns } from './util/columns.js';

describe('Utility functions', () => {
  it('include nullif', async () => {
    const expr = nullif('num1', 0);
    await expect(expr).toBeValidExpr('nullif("num1", 0)');
    expect(expr.name).toBe('nullif');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toEqual(['num1']);
  });
});
