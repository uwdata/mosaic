import { expect, describe, it } from 'vitest';
import { asof_join, column, cross_join, eq, from, join, positional_join, walk } from '../src/index.js';
import { JOIN_CLAUSE, TABLE_REF } from '../src/constants.js';
import { validateQuery } from './util/validate.js';

/** Validate a join clause fragment by wrapping it in a SELECT. */
function validateJoin(clause: { toString(): string }) {
  return validateQuery(`SELECT * FROM ${clause}`);
}

describe('Join functions', () => {
  it('include join', async () => {
    // natural joins
    expect(String(join('t1', 't2'))).toBe('"t1" NATURAL JOIN "t2"');
    await validateJoin(join('t1', 't2'));
    expect(String(join('t1', 't2', { type: 'INNER' }))).toBe('"t1" NATURAL JOIN "t2"');
    expect(String(join('t1', 't2', { type: 'RIGHT' }))).toBe('"t1" NATURAL RIGHT JOIN "t2"');
    await validateJoin(join('t1', 't2', { type: 'RIGHT' }));
    expect(String(join('t1', 't2', { type: 'FULL' }))).toBe('"t1" NATURAL FULL JOIN "t2"');
    await validateJoin(join('t1', 't2', { type: 'FULL' }));
    expect(String(join('t1', 't2', { type: 'LEFT' }))).toBe('"t1" NATURAL LEFT JOIN "t2"');
    await validateJoin(join('t1', 't2', { type: 'LEFT' }));
    expect(String(join('t1', 't2', { type: 'SEMI' }))).toBe('"t1" NATURAL SEMI JOIN "t2"');
    await validateJoin(join('t1', 't2', { type: 'SEMI' }));
    expect(String(join('t1', 't2', { type: 'ANTI' }))).toBe('"t1" NATURAL ANTI JOIN "t2"');
    await validateJoin(join('t1', 't2', { type: 'ANTI' }));

    // regular joins
    const on = eq(column('num1', 't1'), column('num2', 't2'));
    expect(String(join('t1', 't2', { on }))).toBe('"t1" JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    await validateJoin(join('t1', 't2', { on }));
    expect(String(join('t1', 't2', { type: 'INNER', on }))).toBe('"t1" JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    expect(String(join('t1', 't2', { type: 'RIGHT', on }))).toBe('"t1" RIGHT JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    await validateJoin(join('t1', 't2', { type: 'RIGHT', on }));
    expect(String(join('t1', 't2', { type: 'LEFT', on }))).toBe('"t1" LEFT JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    expect(String(join('t1', 't2', { type: 'FULL', on }))).toBe('"t1" FULL JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    expect(String(join('t1', 't2', { type: 'SEMI', on }))).toBe('"t1" SEMI JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    await validateJoin(join('t1', 't2', { type: 'SEMI', on }));
    expect(String(join('t1', 't2', { type: 'ANTI', on }))).toBe('"t1" ANTI JOIN "t2" ON ("t1"."num1" = "t2"."num2")');
    const using = ['num1'];
    expect(String(join('t1', 't2', { using }))).toBe('"t1" JOIN "t2" USING ("num1")');
    await validateJoin(join('t1', 't2', { using }));
    expect(String(join('t1', 't2', { type: 'INNER', using }))).toBe('"t1" JOIN "t2" USING ("num1")');
    expect(String(join('t1', 't2', { type: 'RIGHT', using }))).toBe('"t1" RIGHT JOIN "t2" USING ("num1")');
    await validateJoin(join('t1', 't2', { type: 'RIGHT', using }));
    expect(String(join('t1', 't2', { type: 'LEFT', using }))).toBe('"t1" LEFT JOIN "t2" USING ("num1")');
    expect(String(join('t1', 't2', { type: 'FULL', using }))).toBe('"t1" FULL JOIN "t2" USING ("num1")');
    expect(String(join('t1', 't2', { type: 'SEMI', using }))).toBe('"t1" SEMI JOIN "t2" USING ("num1")');
    expect(String(join('t1', 't2', { type: 'ANTI', using }))).toBe('"t1" ANTI JOIN "t2" USING ("num1")');

    // handles from clauses
    const X = from('t1').as('X');
    const Y = from('t2').as('Y');
    expect(String(join(X, Y, { using }))).toBe('"t1" AS "X" JOIN "t2" AS "Y" USING ("num1")');
    await validateJoin(join(X, Y, { using }));
    expect(String(join(X, Y, { on: eq(column('num1', 'X'), column('num1', 'Y')) })))
      .toBe('"t1" AS "X" JOIN "t2" AS "Y" ON ("X"."num1" = "Y"."num1")');
    await validateJoin(join(X, Y, { on: eq(column('num1', 'X'), column('num1', 'Y')) }));

    // throw on double condition
    expect(() => join('t1', 't2', { on, using })).toThrow();
  });

  it('include cross_join', async () => {
    expect(String(cross_join('t1', 't2'))).toBe('"t1" CROSS JOIN "t2"');
    await validateJoin(cross_join('t1', 't2'));
  });

  it('include positional_join', async () => {
    expect(String(positional_join('t1', 't2'))).toBe('"t1" POSITIONAL JOIN "t2"');
    await validateJoin(positional_join('t1', 't2'));
  });

  it('include asof_join', async () => {
    const using = ['num1', 'num2'];
    expect(String(asof_join('t1', 't2', { using }))).toBe('"t1" ASOF JOIN "t2" USING ("num1", "num2")');
    await validateJoin(asof_join('t1', 't2', { using }));
    expect(String(asof_join('t1', 't2', { type: 'INNER', using }))).toBe('"t1" ASOF JOIN "t2" USING ("num1", "num2")');
    expect(String(asof_join('t1', 't2', { type: 'RIGHT', using }))).toBe('"t1" ASOF RIGHT JOIN "t2" USING ("num1", "num2")');
    await validateJoin(asof_join('t1', 't2', { type: 'RIGHT', using }));
    expect(String(asof_join('t1', 't2', { type: 'LEFT', using }))).toBe('"t1" ASOF LEFT JOIN "t2" USING ("num1", "num2")');
    expect(String(asof_join('t1', 't2', { type: 'FULL', using }))).toBe('"t1" ASOF FULL JOIN "t2" USING ("num1", "num2")');
    expect(String(asof_join('t1', 't2', { type: 'SEMI', using }))).toBe('"t1" ASOF SEMI JOIN "t2" USING ("num1", "num2")');
    expect(String(asof_join('t1', 't2', { type: 'ANTI', using }))).toBe('"t1" ASOF ANTI JOIN "t2" USING ("num1", "num2")');

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
