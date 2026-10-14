import { describe, expect, it } from 'vitest';
import { jsType } from '../src/index.js';

describe('jsType', () => {
  it('maps DuckDB types', () => {
    expect(jsType('DOUBLE')).toBe('number');
    expect(jsType('TIMESTAMP')).toBe('date');
    expect(jsType('VARCHAR')).toBe('string');
  });
});
