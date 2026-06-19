import { expect, describe, it } from 'vitest';
import { asTableRef, deepClone, parseTableRef, TableRefNode } from '../src/index.js';
import { validateQuery } from './util/validate.js';

describe('Table references', () => {
  it('serialize to SQL', async () => {
    expect(String(new TableRefNode('t1'))).toBe(`"t1"`);
    await validateQuery(`SELECT * FROM ${new TableRefNode('t1')}`);
    expect(String(new TableRefNode(['t1']))).toBe(`"t1"`);
    await validateQuery(`SELECT * FROM ${new TableRefNode(['t1'])}`);
    expect(String(new TableRefNode(['main', 't1']))).toBe(`"main"."t1"`);
    await validateQuery(`SELECT * FROM ${new TableRefNode(['main', 't1'])}`);
    expect(String(new TableRefNode(['memory', 'main', 't1']))).toBe(`"memory"."main"."t1"`);
    await validateQuery(`SELECT * FROM ${new TableRefNode(['memory', 'main', 't1'])}`);
  });

  it('are created by asTableRef', () => {
    expect(asTableRef('foo')?.table).toStrictEqual(['foo']);
    expect(asTableRef('foo.bar')?.table).toStrictEqual(['foo.bar']);
    expect(asTableRef('foo.bar.baz')?.table).toStrictEqual(['foo.bar.baz']);
  });

  it('are created by parseTableRef', () => {
    expect(parseTableRef('foo')?.table).toStrictEqual(['foo']);
    expect(parseTableRef('foo.bar')?.table).toStrictEqual(['foo', 'bar']);
    expect(parseTableRef('foo.bar.baz')?.table).toStrictEqual(['foo', 'bar', 'baz']);
  });

  it('clone successfully', () => {
    const ref = new TableRefNode(['foo', 'bar']);

    // shallow clone, only top-level node should change
    const shallow = ref.clone();
    expect(shallow).not.toBe(ref);
    expect(shallow.table).toBe(ref.table);
    expect(shallow.name).toBe(ref.name);

    // deep clone only affects SQL nodes, nothing else should change
    const deep = deepClone(ref);
    expect(deep).not.toBe(ref);
    expect(deep.table).toBe(ref.table);
    expect(deep.name).toBe(ref.name);
  });
});
