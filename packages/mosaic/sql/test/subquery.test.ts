import { expect, describe, it } from 'vitest';
import * as sql from '../src/index.js';
import { asLiteral, avg, column, eq, gt, InOpNode, max, Query, ScalarSubqueryNode } from '../src/index.js';
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
  it('wrap set operations used as operator operands', async () => {
    const u = Query
      .union(
        Query.select('num1').from('t1'),
        Query.select('num1').from('t2')
      )
      .limit(1);
    await expect(
      Query.select('num1').from('t1').where(gt('num1', u))
    ).toBeValidQuery(
      'SELECT "num1" FROM "t1" WHERE ("num1" > (SELECT "num1" FROM "t1" UNION SELECT "num1" FROM "t2" LIMIT 1))'
    );
  });
  it('wrap pivot queries used as expressions', () => {
    // structural only: DuckDB rejects multi-column pivots as scalar subqueries
    const q = Query.select({ p: Query.pivot('t1') }).from('t1');
    expect(String(q)).toBe('SELECT (PIVOT "t1") AS "p" FROM "t1"');
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
  it('wrap every exported query subclass', () => {
    const examples: Record<string, Query> = {
      SelectQuery: Query.select('num1').from('t1'),
      SetOperation: Query.union(
        Query.select('num1').from('t1'),
        Query.select('num1').from('t2')
      ),
      PivotQuery: Query.pivot('t1')
    };

    const subclasses = Object.entries(sql)
      .filter(([, v]) => typeof v === 'function' && v.prototype instanceof Query)
      .map(([name]) => name);

    // a subclass without an example above is new and untested, not exempt
    expect(subclasses.sort()).toStrictEqual(Object.keys(examples).sort());

    for (const name of subclasses) {
      expect(asLiteral(examples[name])).toBeInstanceOf(ScalarSubqueryNode);
    }
  });
});
