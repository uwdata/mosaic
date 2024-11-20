import { expect, describe, it } from 'vitest';
import { loadCSV } from '../src/index.js';

describe('loadCSV', () => {
  it('accepts query options', () => {
    const base = {
      select: ['colA', 'colB'],
      where: 'colX > 5'
    };
    expect(loadCSV('table', 'data.csv', base)).toBe(
      `CREATE TABLE IF NOT EXISTS table AS SELECT colA, colB FROM read_csv('data.csv', auto_detect=true, sample_size=-1) WHERE colX > 5`
    );

    const ext = {
      ...base,
      view: true,
      replace: true
    };
    expect(loadCSV('table', 'data.csv', ext)).toBe(
      `CREATE OR REPLACE VIEW table AS SELECT colA, colB FROM read_csv('data.csv', auto_detect=true, sample_size=-1) WHERE colX > 5`
    );
  });

  it('accepts DuckDB options', () => {
    const opt = {
      auto_detect: false,
      all_varchar: true,
      columns: {line: 'VARCHAR'},
      force_not_null: ['line'],
      new_line: '\\n',
      header: false,
      skip: 2
    };
    expect(loadCSV('table', 'data.csv', opt)).toBe(
      `CREATE TABLE IF NOT EXISTS table AS SELECT * FROM read_csv('data.csv', auto_detect=false, sample_size=-1, all_varchar=true, columns={'line': 'VARCHAR'}, force_not_null=['line'], new_line='\\n', header=false, skip=2)`
    );
  });
});
