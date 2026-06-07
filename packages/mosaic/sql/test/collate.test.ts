import { expect, describe, it } from 'vitest';
import { collate, column } from '../src/index.js';

describe('collate', () => {
  it('specifies string collation', async () => {
    await expect(collate('foo', 'NOCASE')).toBeValidExpr('"foo" COLLATE NOCASE', 'strings');
    await expect(collate(column('foo'), 'NFC')).toBeValidExpr('"foo" COLLATE NFC', 'strings');
    await expect(collate(column('foo'), 'NOCASE.NOACCENT')).toBeValidExpr('"foo" COLLATE NOCASE.NOACCENT', 'strings');
  });
});
