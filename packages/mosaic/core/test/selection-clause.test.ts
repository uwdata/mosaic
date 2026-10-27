import { describe, it, expect } from 'vitest';
import { clauseList, clausePoints } from '../src/index.js';

describe('clauseList', () => {
  const source = {};

  // Regression tests for https://github.com/uwdata/mosaic/issues/977.

  it('quotes list values that contain spaces', () => {
    // previously unquoted, which triggered a DuckDB Parser Error at the space
    const clause = clauseList('tags', ['Drafting Lines'], { source });
    expect(String(clause.predicate)).toBe(
      'list_has_any("tags", [\'Drafting Lines\'])'
    );
  });

  it('quotes single-word list values as literals, not identifiers', () => {
    // previously produced a bare word, which DuckDB read as a Binder Error
    const clause = clauseList('tags', ['Markers'], { source });
    expect(String(clause.predicate)).toBe('list_has_any("tags", [\'Markers\'])');
  });

  it('supports multiple values', () => {
    const clause = clauseList('tags', ['Roads', 'Lakes'], { source });
    expect(String(clause.predicate)).toBe(
      'list_has_any("tags", [\'Roads\', \'Lakes\'])'
    );
  });

  it('supports listMatch "all"', () => {
    const clause = clauseList('tags', ['Roads', 'Lakes'], {
      source,
      listMatch: 'all'
    });
    expect(String(clause.predicate)).toBe(
      'list_has_all("tags", [\'Roads\', \'Lakes\'])'
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

describe('clausePoints', () => {
  const source = {};

  it('uses IN for a single field', () => {
    const clause = clausePoints(['a'], [[1], [2], [null]], { source });
    expect(String(clause.predicate)).toBe(
      '(("a" IN (1, 2)) OR ("a" IS NULL))'
    );
  });

  it('uses tuple IN for multiple fields', () => {
    const clause = clausePoints(['lat', 'lon'], [[12, -5], [90, -110]], { source });
    expect(String(clause.predicate)).toBe(
      '(("lat", "lon") IN ((12, -5), (90, -110)))'
    );
  });

  it('tests tuples with null values separately', () => {
    const clause = clausePoints(['a', 'b'], [[1, 'x'], [null, 'y']], { source });
    expect(String(clause.predicate)).toBe(
      '((("a", "b") IN ((1, \'x\'))) OR (("a" IS NULL) AND ("b" = \'y\')))'
    );
  });

  it('produces a false predicate for an empty array', () => {
    expect(String(clausePoints(['a'], [], { source }).predicate)).toBe('FALSE');
    expect(String(clausePoints(['a', 'b'], [], { source }).predicate)).toBe('FALSE');
  });

  it('produces a null predicate for null values', () => {
    expect(clausePoints(['a', 'b'], null, { source }).predicate).toBe(null);
  });
});
