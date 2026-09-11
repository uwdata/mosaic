import { expect, describe, it } from 'vitest';
import { SQLNode, TupleNode, ValuesNode, literal, tuple, values } from '../src/index.js';
import { validateQuery } from './util/validate.js';

/** Validate a from clause by wrapping it in a SELECT and adding an alias. */
async function validateFrom(from: SQLNode, expected: string) {
  const alias = "t";
  const query = `SELECT * FROM ${from} AS "${alias}"`;
  expect(query).toBe(`SELECT * FROM ${expected} AS "${alias}"`);
  await validateQuery(query);
}

describe('values', () => {
  it('ast node renders a list of tuples', async () => {
    const node = new ValuesNode([
      new TupleNode([literal('a'), literal(1), literal(true)]),
      new TupleNode([literal('b'), literal(2), literal(false)]),
    ]);
    await validateFrom(node, `VALUES ('a', 1, TRUE), ('b', 2, FALSE)`);
  });

  it('function accepts expression node values', async () => {
    const node = values([
      [literal('a'), literal(1), literal(true)],
      tuple([literal('b'), literal(2), literal(false)])
    ]);
    await validateFrom(node, `VALUES ('a', 1, TRUE), ('b', 2, FALSE)`);
  });

  it('function accepts literal values', async () => {
    const node = values([['a', 1, true], ['b', 2, false]]);
    await validateFrom(node, `VALUES ('a', 1, TRUE), ('b', 2, FALSE)`);
  });
});
