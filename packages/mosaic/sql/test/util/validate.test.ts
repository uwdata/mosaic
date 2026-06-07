import { expect, describe, it } from 'vitest';
import { validateExpr, validateQuery } from './validate.js';

describe('validate helper', () => {
  it('accepts a known-good query', async () => {
    await expect(validateQuery('SELECT "foo", "bar" FROM "data"')).resolves.toBeUndefined();
  });

  it('accepts a known-good expression', async () => {
    await expect(validateExpr('(10 * floor(("foo" / (10)::DOUBLE)))')).resolves.toBeUndefined();
  });

  it('accepts a known-good temporal expression', async () => {
    await expect(
      validateExpr('time_bucket(INTERVAL 2 year, "foo")', 'dates')
    ).resolves.toBeUndefined();
  });

  it('rejects an unquoted huge interval (regression #484)', async () => {
    // Parser overflow: INTERVAL with an out-of-range unquoted integer.
    await expect(
      validateExpr('time_bucket(INTERVAL 50000000000 year, "foo")', 'dates')
    ).rejects.toThrow();
  });

  it('rejects an unquoted bare-word string value (regression #977)', async () => {
    // Bare words `Dimension Lines` are not a valid SQL value list.
    await expect(
      validateQuery('SELECT * FROM "data" WHERE ("s" IN (Dimension Lines))')
    ).rejects.toThrow();
  });

  it('rejects an unquoted dotted identifier (regression #933)', async () => {
    // `a.b.c.d` resolves to a non-existent catalog/schema/table -> binder error.
    await expect(
      validateQuery('SELECT a.b.c.d FROM "data"')
    ).rejects.toThrow();
  });
});
