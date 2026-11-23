import { expect, describe, it } from 'vitest';
import { column, count, cross_join, cte, div, eq, filterPushdown, FromClauseNode, gt, join, Query, ScalarSubqueryNode, sum, TableRefNode } from '../src/index.js';

describe('filterPushdown', () => {
  it('does nothing given empty filter', async () => {
    const q = Query.select('num1').from('t1');
    const f = filterPushdown(q, 't1', []);
    await expect(f).toBeValidQuery('SELECT "num1" FROM "t1"');
  });

  it('does nothing given unreferenced table', async () => {
    const q = Query.select('num1').from('t1');
    const f = filterPushdown(q, 'dont_exist', gt('num2', 2));
    await expect(f).toBeValidQuery('SELECT "num1" FROM "t1"');
  });

  it('updates queries', async () => {
    const q = Query.select('num1').from('t1');
    const f = filterPushdown(q, 't1', gt('num2', 2));
    await expect(f).toBeValidQuery(
      'WITH "_t1" AS (SELECT * FROM "t1" WHERE ("num2" > 2)) SELECT "num1" FROM "_t1" AS "t1"'
    );
  });

  it('avoids namespace collisions', async () => {
    const q = Query
      .with({ _t1: Query.select({ other: 'num2' }).from('t2') })
      .select('num1')
      .from('t1', '_t1');
    const f = filterPushdown(q, 't1', gt('num2', 2));
    await expect(f).toBeValidQuery(
      'WITH "__t1" AS (SELECT * FROM "t1" WHERE ("num2" > 2)), "_t1" AS (SELECT "num2" AS "other" FROM "t2") SELECT "num1" FROM "__t1" AS "t1", "_t1"'
    );
  });

  it('updates FROM subqueries', async () => {
    const q = Query.select('v').from(Query.select({ v: 'num2' }).from('t1'));
    const f = filterPushdown(q, 't1', gt('num2', 2));
    await expect(f).toBeValidQuery(
      'WITH "_t1" AS (SELECT * FROM "t1" WHERE ("num2" > 2)) SELECT "v" FROM (SELECT "num2" AS "v" FROM "_t1" AS "t1")'
    );
  });

  it('updates CTEs', async () => {
    const q = Query
      .with({ c: Query.select({ v: 'num2' }).from('t1') })
      .select('v').from('c');
    const f = filterPushdown(q, 't1', gt('num2', 2));
    await expect(f).toBeValidQuery(
      'WITH "_t1" AS (SELECT * FROM "t1" WHERE ("num2" > 2)), "c" AS (SELECT "num2" AS "v" FROM "_t1" AS "t1") SELECT "v" FROM "c"'
    );
  });

  it('updates self joins', async () => {
    const q = Query
      .select('*')
      .from(
        cross_join(
          new FromClauseNode(new TableRefNode('t1'), 'T1'),
          new FromClauseNode(new TableRefNode('t1'), 'T2')
        )
      );
    const f = filterPushdown(q, 't1', gt('num2', 2));
    await expect(f).toBeValidQuery(
      'WITH "_t1" AS (SELECT * FROM "t1" WHERE ("num2" > 2)) SELECT * FROM "_t1" AS "T1" CROSS JOIN "_t1" AS "T2"'
    );
  });

  it('updates explicit joins', async () => {
    const q = Query
      .select('*')
      .from(
        join('t1', 't2', { using: ['num3'] })
      );
    const f = filterPushdown(q, 't1', gt('num2', 2));
    await expect(f).toBeValidQuery(
      'WITH "_t1" AS (SELECT * FROM "t1" WHERE ("num2" > 2)) SELECT * FROM "_t1" AS "t1" JOIN "t2" USING ("num3")'
    );
  });

  it('updates implicit joins', async () => {
    const q = Query
      .select(column('num1', 'T'), column('num2', 'T'), column('num3', 'O'))
      .from(
        new FromClauseNode(new TableRefNode('t1'), 'T'),
        new FromClauseNode(new TableRefNode('t2'), 'O'),
      )
      .where(eq(column('num3', 'T'), column('num3', 'O')));
    const f = filterPushdown(q, 't1', gt('num2', 2));
    await expect(f).toBeValidQuery(
      'WITH "_t1" AS (SELECT * FROM "t1" WHERE ("num2" > 2)) SELECT "T"."num1" AS "num1", "T"."num2" AS "num2", "O"."num3" AS "num3" FROM "_t1" AS "T", "t2" AS "O" WHERE ("T"."num3" = "O"."num3")'
    );
  });

  it('updates pivot queries', async () => {
    const q = Query.pivot('t1').on('num1').using(sum('num2'));
    const f = filterPushdown(q, 't1', gt('num2', 2));
    await expect(f).toBeValidQuery(
      'WITH "_t1" AS (SELECT * FROM "t1" WHERE ("num2" > 2)) PIVOT "_t1" ON "num1" USING sum("num2")'
    );
  });

  it('preserves columns qualified by the base table name', async () => {
    const q = Query
      .select(column('num1', 't1'))
      .from('t1')
      .where(eq(column('num1', 't1'), 1));
    const f = filterPushdown(q, 't1', gt('num2', 2));
    await expect(f).toBeValidQuery(
      'WITH "_t1" AS (SELECT * FROM "t1" WHERE ("num2" > 2)) SELECT "t1"."num1" AS "num1" FROM "_t1" AS "t1" WHERE ("t1"."num1" = 1)'
    );
  });

  it('preserves qualified columns over unaliased from clauses', async () => {
    const q = Query
      .select(column('num1', 't1'))
      .from(new FromClauseNode(new TableRefNode('t1')));
    const f = filterPushdown(q, 't1', gt('num2', 2));
    await expect(f).toBeValidQuery(
      'WITH "_t1" AS (SELECT * FROM "t1" WHERE ("num2" > 2)) SELECT "t1"."num1" AS "num1" FROM "_t1" AS "t1"'
    );
  });

  it('preserves qualified columns in join conditions', async () => {
    const q = Query
      .select(column('num1', 't1'))
      .from(join('t1', 't2', {
        on: eq(column('num3', 't1'), column('num3', 't2'))
      }));
    const f = filterPushdown(q, 't1', gt('num2', 2));
    await expect(f).toBeValidQuery(
      'WITH "_t1" AS (SELECT * FROM "t1" WHERE ("num2" > 2)) SELECT "t1"."num1" AS "num1" FROM "_t1" AS "t1" JOIN "t2" ON ("t1"."num3" = "t2"."num3")'
    );
  });

  it('updates tables defined as CTEs', async () => {
    const q = Query
      .with({ mycte: Query.select('*').from('t1') })
      .select('*').from('mycte');
    const f = filterPushdown(q, 'mycte', gt('num1', 1));
    await expect(f).toBeValidQuery(
      'WITH "mycte" AS (SELECT * FROM "t1"), "_mycte" AS (SELECT * FROM "mycte" WHERE ("num1" > 1)) SELECT * FROM "_mycte" AS "mycte"'
    );
  });

  it('updates tables defined as CTEs with dependent CTEs', async () => {
    const q = Query
      .with({
        mycte: Query.select('*').from('t1'),
        derived: Query.select('num1').from('mycte')
      })
      .select('*').from('derived');
    const f = filterPushdown(q, 'mycte', gt('num1', 1));
    await expect(f).toBeValidQuery(
      'WITH "mycte" AS (SELECT * FROM "t1"), "_mycte" AS (SELECT * FROM "mycte" WHERE ("num1" > 1)), "derived" AS (SELECT "num1" FROM "_mycte" AS "mycte") SELECT * FROM "derived"'
    );
  });

  it('updates tables defined as CTEs with column aliases', async () => {
    const q = Query
      .with(cte('mycte', Query.select('num1').from('t1'), null, ['val']))
      .select('*').from('mycte');
    const f = filterPushdown(q, 'mycte', gt('val', 1));
    await expect(f).toBeValidQuery(
      'WITH "mycte"("val") AS (SELECT "num1" FROM "t1"), "_mycte" AS (SELECT * FROM "mycte" WHERE ("val" > 1)) SELECT * FROM "_mycte" AS "mycte"'
    );
  });

  it('skips scalar subqueries', async () => {
    const sub = new ScalarSubqueryNode(Query.select({ count: count() }).from('t1'))
    const q = Query.select({ norm: div('num1', sub) }).from('t1');
    const f = filterPushdown(q, 't1', gt('num2', 2));
    await expect(f).toBeValidQuery(
      'WITH "_t1" AS (SELECT * FROM "t1" WHERE ("num2" > 2)) SELECT ("num1" / (SELECT count(*) AS "count" FROM "t1")) AS "norm" FROM "_t1" AS "t1"'
    );
  });
});
