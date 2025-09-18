import { expect, describe, it } from 'vitest';
import { asof_join, column, cross_join, eq, from, join, positional_join, walk } from '../src/index.js';
import { JOIN_CLAUSE, TABLE_REF } from '../src/constants.js';

describe('Join functions', () => {
  it('include join', () => {
    // natural joins
    expect(String(join('A', 'B'))).toBe('"A" NATURAL JOIN "B"');
    expect(String(join('A', 'B', { type: 'INNER' }))).toBe('"A" NATURAL JOIN "B"');
    expect(String(join('A', 'B', { type: 'RIGHT' }))).toBe('"A" NATURAL RIGHT JOIN "B"');
    expect(String(join('A', 'B', { type: 'FULL' }))).toBe('"A" NATURAL FULL JOIN "B"');
    expect(String(join('A', 'B', { type: 'LEFT' }))).toBe('"A" NATURAL LEFT JOIN "B"');
    expect(String(join('A', 'B', { type: 'SEMI' }))).toBe('"A" NATURAL SEMI JOIN "B"');
    expect(String(join('A', 'B', { type: 'ANTI' }))).toBe('"A" NATURAL ANTI JOIN "B"');

    // regular joins
    const on = eq(column('foo', 'A'), column('bar', 'B'));
    expect(String(join('A', 'B', { on }))).toBe('"A" JOIN "B" ON ("A"."foo" = "B"."bar")');
    expect(String(join('A', 'B', { type: 'INNER', on }))).toBe('"A" JOIN "B" ON ("A"."foo" = "B"."bar")');
    expect(String(join('A', 'B', { type: 'RIGHT', on }))).toBe('"A" RIGHT JOIN "B" ON ("A"."foo" = "B"."bar")');
    expect(String(join('A', 'B', { type: 'LEFT', on }))).toBe('"A" LEFT JOIN "B" ON ("A"."foo" = "B"."bar")');
    expect(String(join('A', 'B', { type: 'FULL', on }))).toBe('"A" FULL JOIN "B" ON ("A"."foo" = "B"."bar")');
    expect(String(join('A', 'B', { type: 'SEMI', on }))).toBe('"A" SEMI JOIN "B" ON ("A"."foo" = "B"."bar")');
    expect(String(join('A', 'B', { type: 'ANTI', on }))).toBe('"A" ANTI JOIN "B" ON ("A"."foo" = "B"."bar")');
    const using = ['id'];
    expect(String(join('A', 'B', { using }))).toBe('"A" JOIN "B" USING ("id")');
    expect(String(join('A', 'B', { type: 'INNER', using }))).toBe('"A" JOIN "B" USING ("id")');
    expect(String(join('A', 'B', { type: 'RIGHT', using }))).toBe('"A" RIGHT JOIN "B" USING ("id")');
    expect(String(join('A', 'B', { type: 'LEFT', using }))).toBe('"A" LEFT JOIN "B" USING ("id")');
    expect(String(join('A', 'B', { type: 'FULL', using }))).toBe('"A" FULL JOIN "B" USING ("id")');
    expect(String(join('A', 'B', { type: 'SEMI', using }))).toBe('"A" SEMI JOIN "B" USING ("id")');
    expect(String(join('A', 'B', { type: 'ANTI', using }))).toBe('"A" ANTI JOIN "B" USING ("id")');

    // handles from clauses
    const X = from('A').as('X');
    const Y = from('B').as('Y');
    expect(String(join(X, Y, { using }))).toBe('"A" AS "X" JOIN "B" AS "Y" USING ("id")');
    expect(String(join(X, Y, { on: eq(column('id', 'X'), column('id', 'Y')) })))
      .toBe('"A" AS "X" JOIN "B" AS "Y" ON ("X"."id" = "Y"."id")');

    // throw on double condition
    expect(() => join('A', 'B', { on, using })).toThrow();
  });

  it('include cross_join', () => {
    expect(String(cross_join('A', 'B'))).toBe('"A" CROSS JOIN "B"');
  });

  it('include positional_join', () => {
    expect(String(positional_join('A', 'B'))).toBe('"A" POSITIONAL JOIN "B"');
  });

  it('include asof_join', () => {
    const using = ['id', 'when'];
    expect(String(asof_join('A', 'B', { using }))).toBe('"A" ASOF JOIN "B" USING ("id", "when")');
    expect(String(asof_join('A', 'B', { type: 'INNER', using }))).toBe('"A" ASOF JOIN "B" USING ("id", "when")');
    expect(String(asof_join('A', 'B', { type: 'RIGHT', using }))).toBe('"A" ASOF RIGHT JOIN "B" USING ("id", "when")');
    expect(String(asof_join('A', 'B', { type: 'LEFT', using }))).toBe('"A" ASOF LEFT JOIN "B" USING ("id", "when")');
    expect(String(asof_join('A', 'B', { type: 'FULL', using }))).toBe('"A" ASOF FULL JOIN "B" USING ("id", "when")');
    expect(String(asof_join('A', 'B', { type: 'SEMI', using }))).toBe('"A" ASOF SEMI JOIN "B" USING ("id", "when")');
    expect(String(asof_join('A', 'B', { type: 'ANTI', using }))).toBe('"A" ASOF ANTI JOIN "B" USING ("id", "when")');

    // throw on missing condition
    expect(() => asof_join('A', 'B', { type: 'RIGHT' })).toThrow();
  });

  it('are walkable', () => {
    expect(() => walk(
      join('A', 'B'),
      (x) => {
        if (x.type !== JOIN_CLAUSE && x.type !== TABLE_REF) {
          throw new Error('Unexpected node type.');
        }
      }
    )).not.toThrow();
  });
});
