import { expect, describe, it } from 'vitest';
import { columns } from './util/columns.js';
import { cast, column, slice, subscript } from '../src/index.js';

describe('subscript', () => {
  it('indexes lists and strings', async () => {
    await expect(subscript('lst1', 1)).toBeValidExpr('"lst1"[1]');
    await expect(subscript('lst1', column('int1'))).toBeValidExpr('"lst1"["int1"]');
    await expect(subscript(subscript('lst1', 1), 2)).toBeValidExpr('"lst1"[1][2]');
    expect(columns(subscript('lst1', column('int1')))).toStrictEqual(['lst1', 'int1']);
  });

  it('parenthesizes non-trivial targets', async () => {
    await expect(subscript(cast('num1', 'VARCHAR'), 1))
      .toBeValidExpr('(("num1")::VARCHAR)[1]');
  });

  it('interprets string indices as keys', () => {
    expect(`${subscript('s', 'f')}`).toBe('"s"[\'f\']');
  });
});

describe('slice', () => {
  it('slices lists and strings', async () => {
    await expect(slice('lst1', 1, 2)).toBeValidExpr('"lst1"[1:2]');
    await expect(slice('lst1', 2)).toBeValidExpr('"lst1"[2:]');
    await expect(slice('lst1', null, 2)).toBeValidExpr('"lst1"[:2]');
    await expect(slice('lst1', 1, 4, 2)).toBeValidExpr('"lst1"[1:4:2]');
    await expect(slice('txt1', 1, 2)).toBeValidExpr('"txt1"[1:2]');
  });

  it('marks an omitted end when a step is given', async () => {
    await expect(slice('lst1', 1, null, 2)).toBeValidExpr('"lst1"[1:-:2]');
    await expect(slice('lst1', null, null, 2)).toBeValidExpr('"lst1"[:-:2]');
  });
});
