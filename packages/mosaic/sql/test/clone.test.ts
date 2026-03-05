import { expect, describe, it } from 'vitest';
import { add, deepClone, literal, neq, Query, SQLNode, sum, walk } from '../src/index.js';

describe('deepClone', () => {
  it('performs deep clone', () => {
    const q = Query.select({ v: add(1, sum('foo')) })
      .from('tab')
      .groupby('cat')
      .where(neq('cat', literal('meow')));
    const c = deepClone(q);

    expect(c).not.toBe(q);
    expect(String(c)).toBe(String(q));

    const qNodes: SQLNode[] = [];
    const cNodes: SQLNode[] = [];
    walk(q, (node) => qNodes.push(node));
    walk(c, (node) => cNodes.push(node));
    expect(cNodes.length).toBe(qNodes.length);

    for (let i = 0; i < qNodes.length; ++i) {
      const qn = qNodes[i];
      const cn = cNodes[i];
      expect(cn).not.toBe(qn);
      expect(String(cn)).toBe(String(qn));
    }
  });
});
