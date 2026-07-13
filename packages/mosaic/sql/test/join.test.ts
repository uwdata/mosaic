import { expect, describe, it } from 'vitest';
import { asof_join, column, cross_join, eq, from, join, JoinNode, positional_join, walk } from '../src/index.js';
import { JOIN_CLAUSE, TABLE_REF } from '../src/constants.js';
import { validateQuery } from './util/validate.js';

/** Validate a join clause fragment by wrapping it in a SELECT. */
async function validateJoin(clause: JoinNode, expected: string) {
  const query = `SELECT * FROM ${clause}`;
  expect(query).toBe(`SELECT * FROM ${expected}`);
  await validateQuery(query);
}

describe('Join functions', () => {
  it('include join', async () => {
    // natural joins
    await validateJoin(join('t1', 't2'), '"t1" NATURAL JOIN "t2"');

    await validateJoin(join('t1', 't2', { type: 'INNER' }), '"t1" NATURAL JOIN "t2"');
    await validateJoin(join('t1', 't2', { type: 'RIGHT' }), '"t1" NATURAL RIGHT JOIN "t2"');
    await validateJoin(join('t1', 't2', { type: 'FULL' }), '"t1" NATURAL FULL JOIN "t2"');
    await validateJoin(join('t1', 't2', { type: 'LEFT' }), '"t1" NATURAL LEFT JOIN "t2"');
    await validateJoin(join('t1', 't2', { type: 'SEMI' }), '"t1" NATURAL SEMI JOIN "t2"');
    await validateJoin(join('t1', 't2', { type: 'ANTI' }), '"t1" NATURAL ANTI JOIN "t2"');

    // regular joins
    const on = eq(column('num1', 't1'), column('num2', 't2'));
    await validateJoin(join('t1', 't2', { on }), '"t1" JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    await validateJoin(join('t1', 't2', { type: 'INNER', on }), '"t1" JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    await validateJoin(join('t1', 't2', { type: 'RIGHT', on }), '"t1" RIGHT JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    await validateJoin(join('t1', 't2', { type: 'LEFT', on }), '"t1" LEFT JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    await validateJoin(join('t1', 't2', { type: 'FULL', on }), '"t1" FULL JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    await validateJoin(join('t1', 't2', { type: 'SEMI', on }), '"t1" SEMI JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    await validateJoin(join('t1', 't2', { type: 'ANTI', on }), '"t1" ANTI JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    const using = ['num1'];
    await validateJoin(join('t1', 't2', { using }), '"t1" JOIN "t2" USING ("num1")');
    await validateJoin(join('t1', 't2', { type: 'INNER', using }), '"t1" JOIN "t2" USING ("num1")');
    await validateJoin(join('t1', 't2', { type: 'RIGHT', using }), '"t1" RIGHT JOIN "t2" USING ("num1")');
    await validateJoin(join('t1', 't2', { type: 'LEFT', using }), '"t1" LEFT JOIN "t2" USING ("num1")');
    await validateJoin(join('t1', 't2', { type: 'FULL', using }), '"t1" FULL JOIN "t2" USING ("num1")');
    await validateJoin(join('t1', 't2', { type: 'SEMI', using }), '"t1" SEMI JOIN "t2" USING ("num1")');
    await validateJoin(join('t1', 't2', { type: 'ANTI', using }), '"t1" ANTI JOIN "t2" USING ("num1")');

    // handles from clauses
    const X = from('t1').as('X');
    const Y = from('t2').as('Y');
    await validateJoin(join(X, Y, { using }), '"t1" AS "X" JOIN "t2" AS "Y" USING ("num1")');
    await validateJoin(join(X, Y, { on: eq(column('num1', 'X'), column('num1', 'Y')) }), '"t1" AS "X" JOIN "t2" AS "Y" ON ("X"."num1" = "Y"."num1")');

    // throw on double condition
    expect(() => join('t1', 't2', { on, using })).toThrow();
  });

  it('include cross_join', async () => {
    await validateJoin(cross_join('t1', 't2'), '"t1" CROSS JOIN "t2"');
  });

  it('include positional_join', async () => {
    await validateJoin(positional_join('t1', 't2'), '"t1" POSITIONAL JOIN "t2"');
  });

  it('include asof_join', async () => {
    const using = ['num1', 'num2'];
    await validateJoin(asof_join('t1', 't2', { using }), '"t1" ASOF JOIN "t2" USING ("num1", "num2")');
    await validateJoin(asof_join('t1', 't2', { type: 'INNER', using }), '"t1" ASOF JOIN "t2" USING ("num1", "num2")');
    await validateJoin(asof_join('t1', 't2', { type: 'RIGHT', using }), '"t1" ASOF RIGHT JOIN "t2" USING ("num1", "num2")');
    await validateJoin(asof_join('t1', 't2', { type: 'LEFT', using }), '"t1" ASOF LEFT JOIN "t2" USING ("num1", "num2")');
    await validateJoin(asof_join('t1', 't2', { type: 'FULL', using }), '"t1" ASOF FULL JOIN "t2" USING ("num1", "num2")');
    await validateJoin(asof_join('t1', 't2', { type: 'SEMI', using }), '"t1" ASOF SEMI JOIN "t2" USING ("num1", "num2")');
    await validateJoin(asof_join('t1', 't2', { type: 'ANTI', using }), '"t1" ASOF ANTI JOIN "t2" USING ("num1", "num2")');

    // throw on missing condition
    expect(() => asof_join('t1', 't2', { type: 'RIGHT' })).toThrow();
  });

  it('are walkable', () => {
    expect(() => walk(
      join('t1', 't2'),
      (x) => {
        if (x.type !== JOIN_CLAUSE && x.type !== TABLE_REF) {
          throw new Error('Unexpected node type.');
        }
      }
    )).not.toThrow();
  });
});
