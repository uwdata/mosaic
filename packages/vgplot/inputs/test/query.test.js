// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { tableRef } from '@uwdata/mosaic-sql';
import { Menu } from '../src/Menu.js';
import { Search } from '../src/Search.js';
import { Slider } from '../src/Slider.js';
import { Table } from '../src/Table.js';

const from = tableRef('schema_name', 'table_name');
const column = 'my_column';
const qualified = 'FROM "schema_name"."table_name"';

describe('input queries', () => {
  it('menu queries a schema-qualified table', () => {
    expect(String(new Menu({ from, column }).query())).toContain(qualified);
  });

  it('search queries a schema-qualified table', () => {
    expect(String(new Search({ from, column }).query())).toContain(qualified);
  });

  it('slider queries a schema-qualified table', () => {
    expect(String(new Slider({ from, column }).query())).toContain(qualified);
  });

  it('table queries a schema-qualified table', () => {
    const table = new Table({ from, columns: [column] });
    table.schema = [{ table: from, column, sqlType: 'VARCHAR', type: 'string', nullable: true }];
    expect(String(table.query())).toContain(qualified);
  });
});
