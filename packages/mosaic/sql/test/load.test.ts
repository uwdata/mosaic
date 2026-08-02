import { expect, describe, it } from 'vitest';
import { loadCSV, loadObjects } from '../src/index.js';

// Resolve a fixture file path without node imports, which lack typings here.
const dataFile = (name: string) =>
  decodeURIComponent(new URL(`data/${name}`, import.meta.url).pathname);

// Serialization only: read_csv binds against the named file, which does not
// exist in the fixture database.
describe('loadCSV', () => {
  it('accepts query options', () => {
    const base = {
      select: ['colA', 'colB'],
      where: 'colX > 5'
    };
    expect(loadCSV('table', 'data.csv', base).toString()).toBe(
      `CREATE TABLE IF NOT EXISTS "table" AS SELECT colA, colB FROM read_csv('data.csv', auto_detect=true, sample_size=-1) WHERE colX > 5`
    );

    const ext = {
      ...base,
      view: true,
      replace: true
    };
    expect(loadCSV('table', 'data.csv', ext).toString()).toBe(
      `CREATE OR REPLACE VIEW "table" AS SELECT colA, colB FROM read_csv('data.csv', auto_detect=true, sample_size=-1) WHERE colX > 5`
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
    expect(loadCSV('table', 'data.csv', opt).toString()).toBe(
      `CREATE TABLE IF NOT EXISTS "table" AS SELECT * FROM read_csv('data.csv', auto_detect=false, sample_size=-1, all_varchar=true, columns={'line': 'VARCHAR'}, force_not_null=['line'], new_line='\\n', header=false, skip=2)`
    );
  });

  // read_csv binds only if the file exists, hence on-disk fixtures
  it('escapes single quotes in file paths', async () => {
    const file = dataFile(`john's data.csv`);
    await expect(loadCSV('data', file)).toBeValidQuery(
      `CREATE TABLE IF NOT EXISTS "data" AS SELECT * FROM read_csv('${file.replaceAll(`'`, `''`)}', auto_detect=true, sample_size=-1)`
    );
  });

  it('escapes single quotes in string options', async () => {
    const file = dataFile('quoted.csv');
    await expect(loadCSV('data2', file, { quote: `'` })).toBeValidQuery(
      `CREATE TABLE IF NOT EXISTS "data2" AS SELECT * FROM read_csv('${file}', auto_detect=true, sample_size=-1, quote='''')`
    );
  });
});

describe('loadObjects', () => {
  it('supports list-valued fields', async () => {
    const query = loadObjects('posts', [
      { id: 1, title: 'duckdb v1.0', tags: ['release', 'duckdb'] },
      { id: 2, title: 'mosaic v0.18', tags: ['release', 'mosaic'] }
    ]);
    await expect(query).toBeValidQuery(
      `CREATE TABLE IF NOT EXISTS "posts" AS (SELECT 1 AS "id", 'duckdb v1.0' AS "title", ['release', 'duckdb'] AS "tags") UNION ALL (SELECT 2 AS "id", 'mosaic v0.18' AS "title", ['release', 'mosaic'] AS "tags")`
    );
  });

  it('supports struct-valued fields', async () => {
    const query = loadObjects('events', [
      { id: 1, pos: { x: 140.2, y: 22.8 } }
    ]);
    await expect(query).toBeValidQuery(
      `CREATE TABLE IF NOT EXISTS "events" AS (SELECT 1 AS "id", {'x': 140.2, 'y': 22.8} AS "pos")`
    );
  });
});
