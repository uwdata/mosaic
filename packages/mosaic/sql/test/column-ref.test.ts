import { expect, describe, it } from 'vitest';
import { column, asNode, ColumnRefNode, TableRefNode, deepClone, ColumnNameRefNode, parseColumnRef } from '../src/index.js';
import { validateQuery } from './util/validate.js';

describe('Column references', () => {
  it('serialize to SQL', async () => {
    await expect(new ColumnNameRefNode('foo')).toBeValidExpr(`"foo"`);
    expect(String(new ColumnNameRefNode('foo', new TableRefNode('bar')))).toBe(`"bar"."foo"`);
    await validateQuery(`SELECT ${new ColumnNameRefNode('foo', new TableRefNode('bar'))} FROM "bar"`);
    expect(String(new ColumnNameRefNode('foo', new TableRefNode(['baz', 'bar'])))).toBe(`"baz"."bar"."foo"`);
    // Not validated: a 3-part name "baz"."bar"."foo" is a catalog.schema.column
    // reference that the binder cannot resolve against the fixture schema.
    expect(String(new ColumnNameRefNode('avg("col")'))).toBe(`"avg(""col"")"`);
    // Not validated: references a column literally named avg("col"), absent from
    // the fixture; this test only covers identifier-escaping in serialization.
  });

  it('are created from column', async () => {
    const foo = column('foo');
    expect(foo).toBeInstanceOf(ColumnRefNode);
    expect(foo.column).toBe(`foo`);
    expect(foo.table).toBe(undefined);
    await expect(foo).toBeValidExpr(`"foo"`);

    const barfoo = column('foo', 'bar');
    expect(barfoo).toBeInstanceOf(ColumnRefNode);
    expect(barfoo.column).toBe(`foo`);
    expect(barfoo.table).toBeInstanceOf(TableRefNode);
    expect(barfoo.table?.table).toStrictEqual([`bar`]);
    expect(String(barfoo)).toBe(`"bar"."foo"`);
    await validateQuery(`SELECT ${barfoo} FROM "bar"`);
  });

  it('are created from strings by asNode', async () => {
    const node = asNode('foo');
    expect(node).toBeInstanceOf(ColumnRefNode);
    await expect(node).toBeValidExpr(`"foo"`);

    const node2 = asNode('tab.foo');
    expect(node2).toBeInstanceOf(ColumnRefNode);
    expect(String(node2)).toBe(`"tab.foo"`);
    // Not validated: asNode keeps "tab.foo" as a single column name, which does
    // not exist in the fixture (this is the documented non-parsing behavior).
  });

  it('are created from strings by parseColumnRef', async () => {
    const node = parseColumnRef('foo');
    expect(node).toBeInstanceOf(ColumnRefNode);
    await expect(node).toBeValidExpr(`"foo"`);

    const node2 = parseColumnRef('tab.foo');
    expect(node2).toBeInstanceOf(ColumnRefNode);
    expect(String(node2)).toBe(`"tab"."foo"`);
    await validateQuery(`SELECT ${node2} FROM "tab"`);
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
