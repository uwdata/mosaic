import { expect, describe, it } from 'vitest';
import { column, asNode, ColumnRefNode, TableRefNode, deepClone, ColumnNameRefNode } from '../src/index.js';

describe('Column references', () => {
  it('serialize to SQL', () => {
    expect(String(new ColumnNameRefNode('foo'))).toBe(`"foo"`);
    expect(String(new ColumnNameRefNode('foo', new TableRefNode('bar')))).toBe(`"bar"."foo"`);
    expect(String(new ColumnNameRefNode('foo', new TableRefNode(['baz', 'bar'])))).toBe(`"baz"."bar"."foo"`);
    expect(String(new ColumnNameRefNode('avg("col")'))).toBe(`"avg(""col"")"`);
  });

  it('are created from column', () => {
    const foo = column('foo');
    expect(foo).toBeInstanceOf(ColumnRefNode);
    expect(foo.column).toBe(`foo`);
    expect(foo.table).toBe(undefined);
    expect(String(foo)).toBe(`"foo"`);

    const barfoo = column('foo', 'bar');
    expect(barfoo).toBeInstanceOf(ColumnRefNode);
    expect(barfoo.column).toBe(`foo`);
    expect(barfoo.table).toBeInstanceOf(TableRefNode);
    expect(barfoo.table?.table).toStrictEqual([`bar`]);
    expect(String(barfoo)).toBe(`"bar"."foo"`);
  });

  it('are created from strings by asNode', () => {
    const node = asNode('foo');
    expect(node).toBeInstanceOf(ColumnRefNode);
    expect(String(node)).toBe(`"foo"`);
  });

  it('clone successfully', () => {
    const ref = new ColumnNameRefNode('foo', new TableRefNode('bar'));

    // shallow clone, only top-level node should change
    const shallow = ref.clone();
    expect(shallow).not.toBe(ref);
    expect(shallow.column).toBe(ref.column);
    expect(shallow.table).toBe(ref.table);

    // deep clone only affects SQL nodes, nothing else should change
    const deep = deepClone(ref);
    expect(deep).not.toBe(ref);
    expect(deep.column).toBe(ref.column);
    expect(deep.table).not.toBe(ref.table);
  });
});
