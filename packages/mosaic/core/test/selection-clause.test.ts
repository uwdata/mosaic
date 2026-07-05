import { describe, it, expect } from 'vitest';
import { clauseList } from '../src/index.js';

describe('clauseList', () => {
  const source = {};

  // Regression tests for https://github.com/uwdata/mosaic/issues/977: list
  // values must be emitted as a quoted SQL list, not an unquoted string.

  it('quotes list values that contain spaces', () => {
    // Previously this produced list_has_any("tags", Drafting Lines) with the
    // value unquoted, which triggered a DuckDB Parser Error at the space.
    const clause = clauseList('tags', ['Drafting Lines'], { source });
    expect(String(clause.predicate)).toBe(
      `list_has_any("tags", ['Drafting Lines'])`
    );
  });

  it('quotes single-word list values as literals, not identifiers', () => {
    // Previously produced: list_has_any("tags", Markers) -> Binder Error
    // (DuckDB interpreted the bare word as a column reference)
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
    // An empty list must clear the selection rather than filter out every
    // row (a list_has_any check against an empty list would match nothing).
    expect(clauseList('tags', [], { source }).predicate).toBe(null);
  });
});
