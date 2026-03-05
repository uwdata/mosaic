import { expect, describe, it } from 'vitest';
import { asTableRef, deepClone, TableRefNode } from '../src/index.js';

describe('Table references', () => {
  it('serialize to SQL', () => {
    expect(String(new TableRefNode('foo'))).toBe(`"foo"`);
    expect(String(new TableRefNode(['foo']))).toBe(`"foo"`);
    expect(String(new TableRefNode(['foo', 'bar']))).toBe(`"foo"."bar"`);
    expect(String(new TableRefNode(['foo', 'bar', 'baz']))).toBe(`"foo"."bar"."baz"`);
  });

  it('are created by asTableRef', () => {
    expect(asTableRef('foo')?.table).toStrictEqual(['foo']);
    expect(asTableRef('foo.bar')?.table).toStrictEqual(['foo', 'bar']);
    expect(asTableRef('foo.bar.baz')?.table).toStrictEqual(['foo', 'bar', 'baz']);
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
