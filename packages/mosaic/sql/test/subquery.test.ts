import { expect, describe, it } from 'vitest';
import { column, InOpNode, Query, ScalarSubqueryNode } from '../src/index.js';
import { validateQuery } from './util/validate.js';

describe('Scalar subqueries', () => {
  it('are supported', async () => {
    const subq = new ScalarSubqueryNode(Query.select("*").from("foo"));
    expect(String(subq)).toBe('(SELECT * FROM "foo")');
    // Validate the subquery as a derived table (it is not a single-value scalar).
    await validateQuery(`SELECT * FROM ${subq} AS "t"`);
  });
  it('can be tested for inclusion', async () => {
    const subq = new ScalarSubqueryNode(Query.select("value").from("foo").limit(3));
    const test = new InOpNode(column("expr"), subq);
    expect(String(subq)).toBe('(SELECT "value" FROM "foo" LIMIT 3)');
    expect(String(test)).toBe('("expr" IN (SELECT "value" FROM "foo" LIMIT 3))');
    await validateQuery(`SELECT ${test} FROM "foo"`);
  });
});
