import { expect, describe, it } from 'vitest';
import { collate, column } from '../src/index.js';

describe('collate', () => {
  it('specifies string collation', () => {
    expect(String(collate('foo', 'NOCASE'))).toBe('"foo" COLLATE NOCASE');
    expect(String(collate(column('foo'), 'NFC'))).toBe('"foo" COLLATE NFC');
    expect(String(collate(column('foo'), 'NOCASE.NOACCENT'))).toBe('"foo" COLLATE NOCASE.NOACCENT');
  });
});
