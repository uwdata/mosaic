import { expect, describe, it } from 'vitest';
import { clauseIntervals } from '@uwdata/mosaic-core';
import { column, type ExprNode } from '@uwdata/mosaic-sql';
import { filteredExtent } from '../src/marks/util/extent.js';

function predicate(xr: [Date, Date], yr: [number, number]): ExprNode {
  const fields = [column('Date'), column('Close')];
  return clauseIntervals(fields, [xr, yr], { source: {}, clients: new Set() }).predicate;
}

describe('filteredExtent', () => {
  it('extracts interval extents from a filter predicate', () => {
    const a = new Date(Date.UTC(2010, 5, 26));
    const b = new Date(Date.UTC(2010, 5, 27));
    const p = predicate([a, b], [60, 70]);
    expect(filteredExtent(p, '"Date"')).toEqual([a, b]);
    expect(filteredExtent(p, '"Close"')).toEqual([60, 70]);
  });

  it('ignores zero-width extents', () => {
    const t = Date.UTC(2010, 5, 26);
    const p = predicate([new Date(t), new Date(t)], [67, 67]);
    expect(filteredExtent(p, '"Date"')).toBeUndefined();
    expect(filteredExtent(p, '"Close"')).toBeUndefined();
  });
});
