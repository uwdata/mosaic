import { describe, it, expect } from 'vitest';
import { clauseList } from '../src/index.js';

describe('clauseList', () => {
  const source = {};

  // Regression tests for https://github.com/uwdata/mosaic/issues/977.

  it('quotes list values that contain spaces', () => {
    // previously unquoted, which triggered a DuckDB Parser Error at the space
    const clause = clauseList('tags', ['Drafting Lines'], { source });
    expect(String(clause.predicate)).toBe(
      `list_has_any("tags", ['Drafting Lines'])`
    );
  });

  it('quotes single-word list values as literals, not identifiers', () => {
    // previously produced a bare word, which DuckDB read as a Binder Error
    const clause = clauseList('tags', ['Markers'], { source });
    expect(String(clause.predicate)).toBe(`list_has_any("tags", ['Markers'])`);
  });

  it('supports multiple values', () => {
    const clause = clauseList('tags', ['Roads', 'Lakes'], { source });
    expect(String(clause.predicate)).toBe(
      `list_has_any("tags", ['Roads', 'Lakes'])`
    );
  });

  it('supports listMatch "all"', () => {
    const clause = clauseList('tags', ['Roads', 'Lakes'], {
      source,
      listMatch: 'all'
    });
    expect(String(clause.predicate)).toBe(
      `list_has_all("tags", ['Roads', 'Lakes'])`
    );
  });

  it('produces a null predicate for undefined values', () => {
    expect(clauseList('tags', undefined, { source }).predicate).toBe(null);
  });

  it('produces a null predicate for an empty array (clears selection)', () => {
    // an empty list must clear the selection, not filter out every row
    expect(clauseList('tags', [], { source }).predicate).toBe(null);
  });
});
