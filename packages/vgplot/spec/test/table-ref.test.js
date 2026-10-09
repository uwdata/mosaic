import { describe, it, expect } from 'vitest';
import { isTableRef } from '@uwdata/mosaic-sql';
import { InputNode, PlotFromNode, TableRefNode, astToESM, parseSpec } from '../src/index.js';

// JSON specs can't carry a TableRefNode, so a schema-qualified table is written
// as an array of name parts. The parser must turn that array into a proper
// table reference before it reaches the vgplot API, which otherwise treats a
// bare array in Query.from as a list of separate tables.

/** @type {any} */
const spec = {
  vconcat: [
    { input: 'menu', from: ['schema', 'table'], column: 'foo' },
    {
      plot: [{
        mark: 'dot',
        data: { from: ['schema', 'table'], filterBy: '$sel' },
        x: 'a',
        y: 'b'
      }]
    }
  ]
};

function find(node, test, seen = new Set()) {
  if (!node || typeof node !== 'object' || seen.has(node)) return null;
  seen.add(node);
  if (test(node)) return node;
  for (const key of Object.keys(node)) {
    const found = find(node[key], test, seen);
    if (found) return found;
  }
  return null;
}

describe('schema-qualified table references', () => {
  const ast = parseSpec(spec);
  const markData = find(ast, n => n instanceof PlotFromNode);
  const input = find(ast, n => n instanceof InputNode);

  it('parses array table names into table reference nodes', () => {
    expect(markData.table).toBeInstanceOf(TableRefNode);
    expect(input.options.options.from).toBeInstanceOf(TableRefNode);
  });

  it('round-trips the array through JSON', () => {
    expect(markData.toJSON()).toEqual({ from: ['schema', 'table'], filterBy: '$sel' });
    expect(input.toJSON()).toEqual(spec.vconcat[0]);
  });

  it('generates ESM code calling tableRef', () => {
    const esm = astToESM(ast);
    expect(esm).toContain('vg.from(vg.tableRef("schema", "table"), {filterBy: $sel})');
    expect(esm).toContain('vg.menu({from: vg.tableRef("schema", "table"), column: "foo"})');
  });

  it('instantiates a SQL table reference node', () => {
    const table = markData.table.instantiate();
    expect(isTableRef(table)).toBe(true);
    expect(String(table)).toBe('"schema"."table"');

    const { from } = input.options.instantiate({});
    expect(isTableRef(from)).toBe(true);
    expect(String(from)).toBe('"schema"."table"');
  });
});
