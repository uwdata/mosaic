import { expect, describe, it } from 'vitest';
import { column, InOpNode, Query, ScalarSubqueryNode } from '../src/index.js';

describe('Scalar subqueries', () => {
  it('are supported', () => {
    const subq = new ScalarSubqueryNode(Query.select("*").from("foo"));
    expect(String(subq)).toBe('(SELECT * FROM "foo")');
  });
  it('can be tested for inclusion', () => {
    const subq = new ScalarSubqueryNode(Query.select("value").from("foo").limit(3));
    const test = new InOpNode(column("expr"), subq);
    expect(String(subq)).toBe('(SELECT "value" FROM "foo" LIMIT 3)');
    expect(String(test)).toBe('("expr" IN (SELECT "value" FROM "foo" LIMIT 3))');
  });
});
