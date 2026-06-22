import { expect, describe, it } from 'vitest';
import { column, InOpNode, Query, ScalarSubqueryNode } from '../src/index.js';
import { validateQuery } from './util/validate.js';

describe('Scalar subqueries', async () => {
  it('are supported', async () => {
    const subq = new ScalarSubqueryNode(Query.select("*").from("t1"));
    expect(String(subq)).toBe('(SELECT * FROM "t1")');
    // Validate the subquery as a derived table (it is not a single-value scalar).
    await validateQuery(`SELECT * FROM ${subq} AS "t"`)
  });
  it('can be tested for inclusion', async () => {
    const subq = new ScalarSubqueryNode(Query.select("num1").from("t1").limit(3));
    const test = new InOpNode(column("num1"), subq);
    expect(String(subq)).toBe('(SELECT "num1" FROM "t1" LIMIT 3)');
    expect(String(test)).toBe('("num1" IN (SELECT "num1" FROM "t1" LIMIT 3))');
    await validateQuery(`SELECT ${test} FROM "t1"`)
  });
});
