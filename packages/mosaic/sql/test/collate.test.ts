import { expect, describe, it } from 'vitest';
import { collate, column } from '../src/index.js';

describe('collate', () => {
  it('specifies string collation', async () => {
    await expect(collate('txt1', 'NOCASE')).toBeValidExpr('"txt1" COLLATE NOCASE');
    await expect(collate(column('txt1'), 'NFC')).toBeValidExpr('"txt1" COLLATE NFC');
    await expect(collate(column('txt1'), 'NOCASE.NOACCENT')).toBeValidExpr('"txt1" COLLATE NOCASE.NOACCENT');
  });
});
