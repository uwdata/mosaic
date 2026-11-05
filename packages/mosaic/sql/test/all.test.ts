import { expect, describe, it } from 'vitest';
import { all, asc, count, desc, Query } from '../src/index.js';

describe('all', () => {
  it('generates ALL', () => {
    expect(`${all()}`).toBe('ALL');
  });

  it('supports GROUP BY ALL', () => {
    const q = Query.from('t').select('a', { n: count() }).groupby(all());
    expect(`${q}`).toBe('SELECT "a", count(*) AS "n" FROM "t" GROUP BY ALL');
  });

  it('supports ORDER BY ALL', () => {
    expect(`${Query.from('t').select('a', 'b').orderby(all())}`)
      .toBe('SELECT "a", "b" FROM "t" ORDER BY ALL');
    expect(`${Query.from('t').select('a', 'b').orderby(asc(all()))}`)
      .toBe('SELECT "a", "b" FROM "t" ORDER BY ALL ASC');
    expect(`${Query.from('t').select('a', 'b').orderby(desc(all(), true))}`)
      .toBe('SELECT "a", "b" FROM "t" ORDER BY ALL DESC NULLS FIRST');
  });
});
