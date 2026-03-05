import { expect, describe, it } from 'vitest';
import { Query, cte } from '../src/index.js';

describe('cte', () => {
  it('creates a common table expression', () => {
    const q = Query.select({ x: 42 });

    const x = cte('foo', q, false);
    expect(x.name).toBe('foo');
    expect(x.query).toBe(q);
    expect(x.materialized).toBe(false);
    expect(x.toString()).toBe(`"foo" AS NOT MATERIALIZED (${q})`);

    const y = cte('foo', q, true);
    expect(y.name).toBe('foo');
    expect(y.query).toBe(q);
    expect(y.materialized).toBe(true);
    expect(y.toString()).toBe(`"foo" AS MATERIALIZED (${q})`);

    const z = cte('foo', q);
    expect(z.name).toBe('foo');
    expect(z.query).toBe(q);
    expect(z.materialized).toBe(null);
    expect(z.toString()).toBe(`"foo" AS (${q})`);
  });
});
