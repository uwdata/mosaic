import { expect, describe, it } from 'vitest';
import { Query, cte } from '../src/index.js';
import { validateQuery } from './util/validate.js';

describe('cte', () => {
  it('creates a common table expression', async () => {
    const q = Query.select({ x: 42 });

    const x = cte('foo', q, false);
    expect(x.name).toBe('foo');
    expect(x.query).toBe(q);
    expect(x.materialized).toBe(false);
    expect(String(x)).toBe(`"foo" AS NOT MATERIALIZED (${q})`);
    await validateQuery(`WITH ${x} SELECT * FROM "foo"`);

    const y = cte('foo', q, true);
    expect(y.name).toBe('foo');
    expect(y.query).toBe(q);
    expect(y.materialized).toBe(true);
    expect(String(y)).toBe(`"foo" AS MATERIALIZED (${q})`);
    await validateQuery(`WITH ${y} SELECT * FROM "foo"`);

    const z = cte('foo', q);
    expect(z.name).toBe('foo');
    expect(z.query).toBe(q);
    expect(z.materialized).toBe(null);
    expect(String(z)).toBe(`"foo" AS (${q})`);
    await validateQuery(`WITH ${z} SELECT * FROM "foo"`);
  });
});
