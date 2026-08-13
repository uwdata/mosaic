import { describe, it, expect } from 'vitest';
import { toDataColumns } from '../src/index.js';

/**
 * Stub for a Flechette table, which exposes named columns via toColumns.
 */
function flechetteTable(columns: Record<string, unknown[]>, numRows: number) {
  return {
    numRows,
    getChild: () => null,
    toColumns: () => columns
  };
}

/**
 * Stub for an Arrow table that lacks toColumns, as returned by apache-arrow.
 * Third-party database connectors may provide tables in this form.
 */
function arrowTable(columns: Record<string, unknown[]>, numRows: number) {
  return {
    numRows,
    schema: { fields: Object.keys(columns).map(name => ({ name })) },
    getChild: (name: string) => name in columns
      ? { toArray: () => columns[name] }
      : null
  };
}

describe('toDataColumns', () => {
  it('extracts columns from a Flechette table', () => {
    const data = flechetteTable({ a: [1, 2], b: ['x', 'y'] }, 2);
    expect(toDataColumns(data)).toEqual({
      numRows: 2,
      columns: { a: [1, 2], b: ['x', 'y'] }
    });
  });

  it('extracts columns from an Arrow table without toColumns', () => {
    const data = arrowTable({ a: [1, 2], b: ['x', 'y'] }, 2);
    expect(toDataColumns(data)).toEqual({
      numRows: 2,
      columns: { a: [1, 2], b: ['x', 'y'] }
    });
  });

  it('extracts empty columns for absent Arrow children', () => {
    const data = {
      numRows: 0,
      schema: { fields: [{ name: 'a' }] },
      getChild: () => null
    };
    expect(toDataColumns(data)).toEqual({ numRows: 0, columns: { a: [] } });
  });

  it('extracts named columns from an array of objects', () => {
    const data = [{ a: 1, b: 'x' }, { a: 2, b: 'y' }];
    expect(toDataColumns(data)).toEqual({
      numRows: 2,
      columns: { a: [1, 2], b: ['x', 'y'] }
    });
  });

  it('extracts values from an array of primitives', () => {
    expect(toDataColumns([1, 2, 3])).toEqual({ numRows: 3, values: [1, 2, 3] });
  });

  it('throws for unrecognized data', () => {
    expect(() => toDataColumns({})).toThrow(/Unrecognized data format/);
  });
});
