import { expect, describe, it } from 'vitest';
import { avg, column, eq, gt, InOpNode, max, Query, ScalarSubqueryNode } from '../src/index.js';
import { validateQuery } from './util/validate.js';

describe('Scalar subqueries', () => {
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
  it('wrap queries used as operator operands', async () => {
    await expect(
      Query
        .select('num1')
        .from('t1')
        .where(eq(column('num1'), Query.select({ m: max('num1') }).from('t1')))
    ).toBeValidQuery(
      'SELECT "num1" FROM "t1" WHERE ("num1" = (SELECT max("num1") AS "m" FROM "t1"))'
    );
    await expect(
      Query
        .select('num1')
        .from('t1')
        .where(gt('num1', Query.select({ a: avg('num1') }).from('t1')))
    ).toBeValidQuery(
      'SELECT "num1" FROM "t1" WHERE ("num1" > (SELECT avg("num1") AS "a" FROM "t1"))'
    );
  });
  it('wrap queries used in select lists', async () => {
    await expect(
      Query
        .select({ m: Query.select({ a: avg('num1') }).from('t1') })
        .from('t1')
    ).toBeValidQuery(
      'SELECT (SELECT avg("num1") AS "a" FROM "t1") AS "m" FROM "t1"'
    );
  });
});
