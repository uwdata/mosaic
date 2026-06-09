import { expect, describe, it } from 'vitest';
import { column, asNode, ColumnRefNode, TableRefNode, deepClone, ColumnNameRefNode, parseColumnRef } from '../src/index.js';
import { validateQuery } from './util/validate.js';

describe('Column references', () => {
  it('serialize to SQL', async () => {
    await expect(new ColumnNameRefNode('num1')).toBeValidExpr(`"num1"`);
    expect(String(new ColumnNameRefNode('num1', new TableRefNode('t1')))).toBe(`"t1"."num1"`);
    await validateQuery(`SELECT ${new ColumnNameRefNode('num1', new TableRefNode('t1'))} FROM "t1"`);
    expect(String(new ColumnNameRefNode('num1', new TableRefNode(['baz', 'bar'])))).toBe(`"baz"."bar"."num1"`);
    // Not validated: a 3-part name "baz"."bar"."foo" is a catalog.schema.column
    // reference that the binder cannot resolve against the fixture schema.
    expect(String(new ColumnNameRefNode('avg("col")'))).toBe(`"avg(""col"")"`);
    // Not validated: references a column literally named avg("col"), absent from
    // the fixture; this test only covers identifier-escaping in serialization.
  });

  it('are created from column', async () => {
    const foo = column('num1');
    expect(foo).toBeInstanceOf(ColumnRefNode);
    expect(foo.column).toBe(`num1`);
    expect(foo.table).toBe(undefined);
    await expect(foo).toBeValidExpr(`"num1"`);

    const barfoo = column('num1', 't1');
    expect(barfoo).toBeInstanceOf(ColumnRefNode);
    expect(barfoo.column).toBe(`num1`);
    expect(barfoo.table).toBeInstanceOf(TableRefNode);
    expect(barfoo.table?.table).toStrictEqual([`t1`]);
    expect(String(barfoo)).toBe(`"t1"."num1"`);
    await validateQuery(`SELECT ${barfoo} FROM "t1"`);
  });

  it('are created from strings by asNode', async () => {
    const node = asNode('num1');
    expect(node).toBeInstanceOf(ColumnRefNode);
    await expect(node).toBeValidExpr(`"num1"`);

    const node2 = asNode('tab.num1');
    expect(node2).toBeInstanceOf(ColumnRefNode);
    expect(String(node2)).toBe(`"tab.num1"`);
    // Not validated: asNode keeps "tab.foo" as a single column name, which does
    // not exist in the fixture (this is the documented non-parsing behavior).
  });

  it('are created from strings by parseColumnRef', async () => {
    const node = parseColumnRef('num1');
    expect(node).toBeInstanceOf(ColumnRefNode);
    await expect(node).toBeValidExpr(`"num1"`);

    const node2 = parseColumnRef('t1.num1');
    expect(node2).toBeInstanceOf(ColumnRefNode);
    expect(String(node2)).toBe(`"t1"."num1"`);
    await validateQuery(`SELECT ${node2} FROM "t1"`);
  });

  it('clone successfully', () => {
    const ref = new ColumnNameRefNode('num1', new TableRefNode('t1'));

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
